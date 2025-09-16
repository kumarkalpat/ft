import { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import { Person } from '../types';

// More robust Google Drive URL converter
const convertGoogleDriveUrl = (url: string): string => {
  if (!url || !url.includes('drive.google.com')) {
    return url;
  }
  const regex = /drive\.google\.com\/(?:file\/d\/|open\?id=|thumbnail\?id=)([a-zA-Z0-9_-]+)/;
  const match = url.match(regex);
  if (match && match[1]) {
    // Using a thumbnail link is often more reliable and faster
    return `https://lh3.googleusercontent.com/d/${match[1]}=w200-h200-c`;
  }
  return url;
};


export const useFamilyTree = (sheetUrl: string | undefined, fallbackCsv: string) => {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      const processData = (csvData: string) => {
        try {
          const parsed = Papa.parse(csvData, {
            header: true,
            skipEmptyLines: true,
            transformHeader: header => header.trim(),
          });

          if (parsed.errors.length > 0) {
              console.error("Parsing errors:", parsed.errors);
              throw new Error(`CSV Parsing Error: ${parsed.errors[0].message}`);
          }
          
          const rawPeople = parsed.data as any[];

          const validPeople: Person[] = rawPeople
            .map(row => {
               if (!row.id || !row.name) {
                return null;
              }
              return {
                ...row,
                id: String(row.id),
                parentsIds: [row.fatherID, row.motherID].filter(Boolean),
                partnerId: row.spouseID,
                imageUrl: convertGoogleDriveUrl(row.imageUrl),
                children: [],
              };
            })
            .filter((p): p is Person => p !== null);

            setPeople(validPeople);

        } catch (e: any) {
          setError(`Failed to parse data. Please check CSV format. Error: ${e.message}`);
          setPeople([]);
        } finally {
            setLoading(false);
        }
      };

      if (sheetUrl) {
        try {
          const response = await fetch(sheetUrl);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const csvText = await response.text();
          processData(csvText);
        } catch (e: any) {
            console.error("Failed to fetch Google Sheet, using fallback.", e);
            processData(fallbackCsv);
        }
      } else {
        processData(fallbackCsv);
      }
    };
    fetchData();
  }, [sheetUrl, fallbackCsv]);

  // FIX: Calculate peopleMap and roots from the flat list of people.
  const { peopleMap, roots } = useMemo(() => {
    if (people.length === 0) {
      return { peopleMap: new Map<string, Person>(), roots: [] };
    }

    const peopleMap = new Map<string, Person>();
    people.forEach(p => {
      // Create a new object for each person to avoid mutation issues.
      peopleMap.set(p.id, { ...p, children: [] });
    });

    const nonRoots = new Set<string>();
    peopleMap.forEach(person => {
      // Link spouse
      if (person.partnerId) {
        const spouse = peopleMap.get(person.partnerId);
        if (spouse) {
          person.spouse = spouse;
        }
      }

      // Link children to their parents
      person.parentsIds.forEach(parentId => {
        const parent = peopleMap.get(parentId);
        if (parent) {
          if (!parent.children.some(child => child.id === person.id)) {
            parent.children.push(person);
          }
          nonRoots.add(person.id);
        }
      });
    });

    // Sort children by birth date (oldest first)
    peopleMap.forEach(person => {
      if (person.children && person.children.length > 1) {
        person.children.sort((a, b) => {
          if (!a.birthDate) return 1; // People without birth dates go to the end
          if (!b.birthDate) return -1;
          return new Date(a.birthDate).getTime() - new Date(b.birthDate).getTime();
        });
      }
    });

    const rootList: Person[] = [];
    peopleMap.forEach(person => {
      if (!nonRoots.has(person.id)) {
        rootList.push(person);
      }
    });
    
    // Filter out individuals who are spouses of someone already in the tree (a non-root)
    const trueRootList = rootList.filter(person => {
        // If a person's spouse is a child of another family, that person should not be a root.
        // They will be displayed alongside their spouse within that family's branch.
        if (person.spouse && nonRoots.has(person.spouse.id)) {
            return false;
        }
        return true;
    });

    // De-duplicate roots to avoid rendering the same family twice if both spouses are roots.
    const finalRoots: Person[] = [];
    const processedRoots = new Set<string>();
    trueRootList.forEach(p => {
        if (processedRoots.has(p.id)) return;
        finalRoots.push(p);
        processedRoots.add(p.id);
        if (p.spouse) {
            processedRoots.add(p.spouse.id);
        }
    });

    return { peopleMap, roots: finalRoots };
  }, [people]);

  // FIX: Return the calculated values and state from the hook.
  return { roots, peopleMap, loading, error };
};