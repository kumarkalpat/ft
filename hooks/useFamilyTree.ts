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
    // If the sheetUrl is explicitly undefined, it means we shouldn't fetch any data yet.
    // This is used to wait for an action like authentication before loading the tree.
    if (sheetUrl === undefined) {
      setPeople([]);
      setLoading(false);
      setError(null);
      return;
    }

    const processData = (csvData: string) => {
        try {
          const parsed = Papa.parse(csvData, {
            header: true,
            skipEmptyLines: true,
            transformHeader: header => header.trim(),
          });

          if (parsed.errors.length > 0) {
              console.error("Parsing errors:", parsed.errors);
              const firstError = parsed.errors[0];
              let detailedMessage = `CSV Parsing Error: ${firstError.message}`;
              if (firstError.code === 'TooManyFields') {
                  // row is 0-indexed, and header is row 0, so data starts at sheet row 2.
                  detailedMessage = `The data in your Google Sheet seems to be misformatted on row ${firstError.row + 2}. The error is: "${firstError.message}". This is often caused by an extra comma in a field like 'bio' that isn't enclosed in double quotes. Please check that row in your sheet.`;
              }
              throw new Error(detailedMessage);
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
            setError(null); // Clear error on successful parse

        } catch (e: any) {
          setError(`Failed to parse data. ${e.message}`);
          setPeople([]);
        }
      };

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      if (sheetUrl) {
        try {
          const response = await fetch(sheetUrl);
          if (!response.ok) {
            throw new Error(`Could not load data from the URL (Status: ${response.status}). Please check the URL and ensure your sheet is public.`);
          }
          
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('text/html')) {
              throw new Error(`Invalid data format. Expected CSV data but received an HTML page. This usually means the Google Sheet is not public or the URL is incorrect. Please ensure your URL ends with '/export?format=csv' and that "Anyone with the link" can view the sheet.`);
          }

          const csvText = await response.text();
          processData(csvText);
        } catch (e: any) {
            console.error("Failed to fetch or parse Google Sheet.", e);
            setError(e.message || 'An unknown error occurred while fetching data.');
            setPeople([]);
        } finally {
            setLoading(false);
        }
      } else {
        // Use fallback data if no URL is provided
        processData(fallbackCsv);
        setLoading(false);
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
          // By appending T00:00:00, we ensure the date string is parsed in the local timezone, not UTC.
          return new Date(`${a.birthDate}T00:00:00`).getTime() - new Date(`${b.birthDate}T00:00:00`).getTime();
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
