import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useFamilyTree } from './hooks/useFamilyTree';
import { FamilyTree } from './components/FamilyTree';
import { PersonDetails } from './components/PersonDetails';
import { Person } from './types';
import { SecureImage } from './components/SecureImage';

const fallbackData = `id,name,gender,fatherID,motherID,spouseID,imageUrl,birthDate,bio
1,John Doe,Male,,,2,https://ui-avatars.com/api/?name=John+Doe,1950-01-01,Founder of the Doe family.
2,Jane Smith,Female,,,1,https://ui-avatars.com/api/?name=Jane+Smith,1952-05-10,Matriarch of the Doe family.
3,Peter Doe,Male,1,2,4,https://ui-avatars.com/api/?name=Peter+Doe,1975-03-20,Eldest son of John and Jane.
4,Mary Johnson,Female,,,3,https://ui-avatars.com/api/?name=Mary+Johnson,1976-11-15,Wife of Peter Doe.
5,Susan Doe,Female,1,2,,https://ui-avatars.com/api/?name=Susan+Doe,1980-08-05,Youngest daughter of John and Jane.
6,David Doe,Male,3,4,,,https://ui-avatars.com/api/?name=David+Doe,2000-06-25,Son of Peter and Mary.
`;

const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR_yf7sbtXO20OfLxqeCHwVa54D2-FOEY8MZXIVbbt3oqoh9qIEpFM4mmisJ8r4mhtASlGZIKfsK75F/pub?gid=0&single=true&output=csv';

const App: React.FC = () => {
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [focusedPersonId, setFocusedPersonId] = useState<string | null>(null);
  const [highlightedIds, setHighlightedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const { roots, peopleMap, loading, error } = useFamilyTree(SHEET_URL, fallbackData);

  useEffect(() => {
      if (peopleMap.size > 0) {
        const params = new URLSearchParams(window.location.search);
        const focusId = params.get('focusedPersonId');
        if (focusId && peopleMap.has(focusId)) {
            setFocusedPersonId(focusId);
            setSelectedPerson(peopleMap.get(focusId) || null);
        }
      }
  }, [peopleMap]);

  useEffect(() => {
    if (!focusedPersonId || !peopleMap.size) {
        setHighlightedIds(new Set());
        return;
    }

    const person = peopleMap.get(focusedPersonId);
    if (!person) {
        setHighlightedIds(new Set());
        return;
    }
    
    // In focus mode, we highlight the entire visible tree (ancestors and all descendants)
    // to prevent any dimming.
    const idsToHighlight = new Set<string>();

    const collectDescendants = (p: Person) => {
        idsToHighlight.add(p.id);
        if (p.spouse) idsToHighlight.add(p.spouse.id);
        p.children.forEach(collectDescendants);
    };

    // Start with the focused person and all their descendants
    collectDescendants(person);

    // Add immediate ancestors
    const father = person.fatherID ? peopleMap.get(person.fatherID) : undefined;
    const mother = person.motherID ? peopleMap.get(person.motherID) : undefined;

    if (father) {
      idsToHighlight.add(father.id);
      if (father.spouse) idsToHighlight.add(father.spouse.id);
    }
    if (mother) {
      idsToHighlight.add(mother.id);
      if (mother.spouse) idsToHighlight.add(mother.spouse.id);
    }
    
    setHighlightedIds(idsToHighlight);
  }, [focusedPersonId, peopleMap]);


  // Used for single-click actions from search or details panel
  const handleNodeClick = useCallback((person: Person) => {
    const fullPerson = peopleMap.get(person.id);
    setSelectedPerson(fullPerson || null);
    setSearchQuery('');
    if (focusedPersonId !== person.id) {
      setFocusedPersonId(person.id);
    }
  }, [focusedPersonId, peopleMap]);
  
  // Used for single-clicking nodes in the tree to toggle focus
  const handleFocusToggle = useCallback((person: Person) => {
    if (focusedPersonId === person.id) {
        setFocusedPersonId(null);
    } else {
        setFocusedPersonId(person.id);
    }
  }, [focusedPersonId]);

  // Used for double-clicking nodes in the tree to show details
  const handleShowDetails = useCallback((person: Person) => {
    const fullPerson = peopleMap.get(person.id);
    setSelectedPerson(fullPerson || null);
    // Also ensure focus when opening details
    if (focusedPersonId !== person.id) {
        setFocusedPersonId(person.id);
    }
  }, [peopleMap, focusedPersonId]);


  const handleCloseDetails = () => {
    setSelectedPerson(null);
  };
  
  const handleClearFocus = () => {
      setFocusedPersonId(null);
  };
  
  const handleExportPdf = async () => {
      const treeElement = document.querySelector('.tree-content') as HTMLElement;
      if (!treeElement) return;
      
      setIsExporting(true);
      
      const originalTransform = treeElement.style.transform;
      // Reset transform to capture at full native resolution
      treeElement.style.transform = '';
      // Allow a moment for repaint
      await new Promise(resolve => setTimeout(resolve, 100));

      try {
        const canvas = await (window as any).html2canvas(treeElement, {
            scale: 2, // Increase scale for higher DPI
            backgroundColor: document.documentElement.classList.contains('dark') ? '#0f172a' : '#f8fafc',
            useCORS: true,
            logging: false,
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new (window as any).jspdf.jsPDF({
            orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
            unit: 'px',
            format: [canvas.width, canvas.height],
            hotfixes: ['px_scaling'], // Important for correct scaling
        });
        
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height, undefined, 'FAST');
        pdf.save("family-tree.pdf");

      } catch (e) {
          console.error("Failed to export PDF", e);
      } finally {
        // Restore the original transform and state
        treeElement.style.transform = originalTransform;
        setIsExporting(false);
      }
  };

  const searchResults = useMemo(() => {
    if (!searchQuery) return [];
    const lowerCaseQuery = searchQuery.toLowerCase();
    const results: Person[] = [];
    for (const person of peopleMap.values()) {
        if (person.name.toLowerCase().includes(lowerCaseQuery) || person.alias?.toLowerCase().includes(lowerCaseQuery)) {
            results.push(person);
        }
    }
    return results.slice(0, 10);
  }, [searchQuery, peopleMap]);

  const displayedRoots = useMemo(() => {
    if (!focusedPersonId) return roots;
    const focusedPerson = peopleMap.get(focusedPersonId);
    if (!focusedPerson) return [];

    // Recursively build a clean descendant tree from the main peopleMap.
    // This ensures that we show all descendants (grandchildren and beyond)
    // by using the fully-populated objects from the map.
    const buildDescendantTree = (person: Person): Person => {
      const fullChildren = person.children.map(child => {
        const childFromMap = peopleMap.get(child.id)!;
        return buildDescendantTree(childFromMap);
      });
      return { ...person, children: fullChildren };
    };

    const focusedPersonWithDescendants = buildDescendantTree(focusedPerson);

    // Find immediate ancestors to create the context for the focused view.
    const father = focusedPerson.fatherID ? peopleMap.get(focusedPerson.fatherID) : undefined;
    const mother = focusedPerson.motherID ? peopleMap.get(focusedPerson.motherID) : undefined;
    
    // If the focused person has no parents, they are the root of this view.
    if (!father && !mother) {
        return [focusedPersonWithDescendants];
    }

    // Create shallow clones of the parents to avoid mutating the original data.
    // Set the focused person (with all their descendants) as the ONLY child to prune siblings.
    const fatherClone = father ? { ...father, children: [focusedPersonWithDescendants], spouse: undefined } : undefined;
    const motherClone = mother ? { ...mother, children: [focusedPersonWithDescendants], spouse: undefined } : undefined;
    
    // Link the cloned parents to each other as spouses.
    if (fatherClone && motherClone) {
        fatherClone.spouse = motherClone;
        motherClone.spouse = fatherClone;
    }

    // Return one of the parents as the root. The TreeNode component will render the spouse.
    return fatherClone ? [fatherClone] : [motherClone!];
  }, [focusedPersonId, roots, peopleMap]);


  return (
    <div className="font-sans antialiased text-slate-900 bg-slate-50 dark:bg-slate-900 dark:text-white h-screen w-screen overflow-hidden flex flex-col">
       <header className="flex-shrink-0 bg-white dark:bg-slate-800 shadow-md z-20">
            <div className="container mx-auto px-4 py-3 flex justify-between items-center gap-4">
                <h1 className="text-xl font-bold hidden sm:block">Kalpats Family Tree</h1>
                
                <div className="flex-1 flex justify-center">
                    <div className="relative w-full max-w-md">
                        <input
                            type="text"
                            placeholder="Search for a person..."
                            className="w-full pl-4 pr-4 py-2 rounded-full bg-slate-100 dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => setIsSearchFocused(true)}
                            onBlur={() => setTimeout(() => setIsSearchFocused(false), 100)}
                        />
                         {isSearchFocused && searchResults.length > 0 && (
                            <ul className="absolute top-full mt-2 w-full bg-white dark:bg-slate-800 rounded-lg shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                                {searchResults.map(person => (
                                    <li key={person.id}>
                                        <button onClick={() => handleNodeClick(person)} className="w-full text-left flex items-center gap-3 p-3 hover:bg-slate-100 dark:hover:bg-slate-700">
                                            <SecureImage name={person.name} src={person.imageUrl} alt={person.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                                            <div>
                                                <p className="font-semibold">{person.name}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">{person.birthDate || ''}</p>
                                            </div>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    {focusedPersonId && (
                        <button onClick={handleClearFocus} title="Reset View" className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12a8 8 0 018-8v0a8 8 0 018 8v0a8 8 0 01-8 8v0a8 8 0 01-8-8v0z" /></svg>
                        </button>
                    )}
                     <button onClick={handleExportPdf} disabled={isExporting} title="Export to PDF" className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50">
                        {isExporting ?
                            <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            :
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        }
                    </button>
                </div>
            </div>
        </header>

        <main className="flex-grow relative">
            {loading && (
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-40">
                    <div className="text-center p-4 bg-slate-800 rounded-lg shadow-xl">
                        <svg className="animate-spin h-8 w-8 text-white mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="text-white text-lg">Loading family data...</p>
                    </div>
                </div>
            )}
            {error && (
                <div className="absolute inset-0 bg-red-100 dark:bg-red-900/50 flex items-center justify-center z-40 p-4">
                    <div className="text-center bg-white dark:bg-slate-800 p-6 rounded-lg shadow-2xl">
                        <p className="text-red-700 dark:text-red-200 text-lg font-semibold">An error occurred</p>
                        <p className="text-red-600 dark:text-red-300 mt-2">{error}</p>
                    </div>
                </div>
            )}
            {!loading && !error && displayedRoots.length > 0 && (
                <FamilyTree 
                    roots={displayedRoots} 
                    onFocusPerson={handleFocusToggle}
                    onShowDetails={handleShowDetails}
                    selectedPersonId={selectedPerson?.id}
                    peopleMap={peopleMap}
                    highlightedIds={highlightedIds}
                    isInFocusMode={!!focusedPersonId}
                />
            )}
            {!loading && !error && displayedRoots.length === 0 && (
                 <div className="absolute inset-0 flex items-center justify-center z-10 p-4">
                    <div className="text-center text-slate-500 dark:text-slate-400">
                        <p className="text-lg">No family data found.</p>
                        <p className="text-sm">Please check your Google Sheet or reset the view.</p>
                    </div>
                </div>
            )}
             <PersonDetails 
                person={selectedPerson} 
                onClose={handleCloseDetails}
                onSelectPerson={handleNodeClick}
                peopleMap={peopleMap}
             />
        </main>
    </div>
  );
};

export default App;