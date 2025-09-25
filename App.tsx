

// FIX: To correctly augment the global `ImportMeta` type within a module,
// the declaration must be wrapped in `declare global`. This prevents creating a local
// type that shadows the global one and ensures TypeScript recognizes `import.meta.env`.
declare global {
  interface ImportMeta {
    readonly env: {
      readonly VITE_SHEET_URL?: string;
      readonly VITE_CONFIG_SHEET_URL?: string;
    };
  }
}

import React, { useState, useCallback, useMemo, useEffect, useRef, useLayoutEffect } from 'react';
import Papa from 'papaparse';
import { useFamilyTree } from './hooks/useFamilyTree';
import { FamilyTree, FamilyTreeHandle, MinimapViewport } from './components/FamilyTree';
import { PersonDetails } from './components/PersonDetails';
import { Person } from './types';
import { SecureImage } from './components/SecureImage';
import { Minimap } from './components/Minimap';
import { HelpScreen } from './components/HelpScreen';

// Fallback URL for the main family data (Sheet 1).
const FALLBACK_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR_yf7sbtXO20OfLxqeCHwVa54D2-FOEY8MZXIVbbt3oqoh9qIEpFM4mmisJ8r4mhtASlGZIKfsK75F/pub?gid=0&single=true&output=csv';
// Fallback URL for the app configuration (Sheet 2).
const FALLBACK_CONFIG_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR_yf7sbtXO20OfLxqeCHwVa54D2-FOEY8MZXIVbbt3oqoh9qIEpFM4mmisJ8r4mhtASlGZIKfsK75F/pub?gid=1344337429&single=true&output=csv';

const fallbackData = `id,fatherID,motherID,spouseID,name,alias,gender,birthDate,birthPlace,marriageDate,marriagePlace,deathDate,imageUrl
1,,,2,John Kalpat,Johnny,Male,1950-01-01,New York,1974-06-15,New York,2020-12-25,https://ui-avatars.com/api/?name=John+Kalpat
2,,,1,Jane Doe,,Female,1952-05-10,Boston,1974-06-15,New York,,https://ui-avatars.com/api/?name=Jane+Doe
3,1,2,4,Peter Kalpat,,Male,1975-03-20,New York,1999-09-01,Miami,,https://ui-avatars.com/api/?name=Peter+Kalpat
4,,,3,Mary Johnson,,Female,1976-11-15,Chicago,1999-09-01,Miami,,https://ui-avatars.com/api/?name=Mary+Johnson
5,3,4,,David Kalpat,,Male,2000-06-25,Miami,,,,https://ui-avatars.com/api/?name=David+Kalpat
`;

// Embedded fallback data for app configuration (title, logo).
const fallbackConfigData = `appTitle,logoUrl\n"Kalpats Family Tree","https://lh3.googleusercontent.com/d/1YVlP-a3u3dwxd3BsEGoO4LQHX6wDMXfs"`;

// This logic determines which Google Sheet to load and sets a label for debugging.
const SHEET_URL = import.meta.env?.VITE_SHEET_URL || FALLBACK_SHEET_URL;
const CONFIG_SHEET_URL = import.meta.env?.VITE_CONFIG_SHEET_URL || FALLBACK_CONFIG_SHEET_URL;
const dataSourceLabel = import.meta.env?.VITE_SHEET_URL ? 'Vercel Environment Variable' : 'Fallback URL';

const ThemeToggle: React.FC = () => {
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

    useEffect(() => {
        const root = window.document.documentElement;
        const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

        root.classList.toggle('dark', isDark);
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        
        const handleChange = () => {
            if (theme === 'system') {
                document.documentElement.classList.toggle('dark', mediaQuery.matches);
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [theme]);
    
    const handleThemeCycle = () => {
        setTheme(current => {
            if (current === 'light') return 'dark';
            if (current === 'dark') return 'system';
            return 'light';
        });
    };

    const icons = {
        light: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
        dark: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>,
        system: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
    };

    const tooltips = {
        light: 'Switch to Dark Mode',
        dark: 'Switch to System Theme',
        system: 'Switch to Light Mode',
    };

    return (
        <button onClick={handleThemeCycle} title={tooltips[theme as keyof typeof tooltips]} className="p-2 rounded-full text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700">
            {icons[theme as keyof typeof icons]}
        </button>
    );
};


const App: React.FC = () => {
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [focusedPersonId, setFocusedPersonId] = useState<string | null>(null);
  const [highlightedIds, setHighlightedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isHelpVisible, setIsHelpVisible] = useState(false);
  
  const [visibleNodeIds, setVisibleNodeIds] = useState<Set<string>>(new Set());
  const [spouseVisibleFor, setSpouseVisibleFor] = useState<Set<string>>(new Set());
  const [isInitialAnimationComplete, setIsInitialAnimationComplete] = useState(false);
  const [personToFocusForAnimation, setPersonToFocusForAnimation] = useState<string | null>(null);
  
  const [appConfig, setAppConfig] = useState({
    title: 'Family Tree',
    logoUrl: 'https://lh3.googleusercontent.com/d/1YVlP-a3u3dwxd3BsEGoO4LQHX6wDMXfs'
  });


  const treeRef = useRef<FamilyTreeHandle>(null);

  const { roots, peopleMap, loading, error } = useFamilyTree(SHEET_URL, fallbackData);

  const [minimapViewport, setMinimapViewport] = useState<MinimapViewport>({
    containerSize: { width: 0, height: 0 },
    contentSize: { width: 0, height: 0 },
    pan: { x: 0, y: 0 },
    scale: 1,
  });

  // Effect to fetch application configuration from Sheet 2
  useEffect(() => {
    const parseAndSetConfig = (csvText: string) => {
        try {
            const parsed = Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                transformHeader: header => header.trim(),
            });
            
            const configData = parsed.data[0] as { appTitle?: string; logoUrl?: string };
            if (configData) {
                setAppConfig(prev => ({
                    title: configData.appTitle || prev.title,
                    logoUrl: configData.logoUrl || prev.logoUrl
                }));
            }
        } catch (e) {
            console.error("Failed to parse config data:", e);
        }
    };

    const loadConfig = async () => {
        const isUsingVercelUrl = !!import.meta.env?.VITE_CONFIG_SHEET_URL;

        if (isUsingVercelUrl) {
            try {
                const response = await fetch(CONFIG_SHEET_URL);
                if (!response.ok) {
                    throw new Error(`Status: ${response.status}`);
                }
                const csvText = await response.text();
                parseAndSetConfig(csvText);
            } catch (error) {
                console.error(`Error fetching app config from ${CONFIG_SHEET_URL}:`, error);
                // Graceful degradation for Vercel: if the config fetch fails, keep the default.
            }
        } else {
            // For local/preview, directly use the embedded fallback data.
            // This avoids any network request and fixes the "Failed to fetch" error.
            parseAndSetConfig(fallbackConfigData);
        }
    };

    loadConfig();
  }, [CONFIG_SHEET_URL]);

  // Effect to update the document title and favicon when config changes
  useEffect(() => {
      document.title = appConfig.title;
      const favicon = document.querySelector<HTMLLinkElement>("link[rel='icon']");
      if (favicon && appConfig.logoUrl) {
          favicon.href = appConfig.logoUrl;
      }
  }, [appConfig.title, appConfig.logoUrl]);

  const handleViewportUpdate = useCallback((viewport: MinimapViewport) => {
      setMinimapViewport(viewport);
  }, []);

  const handleMinimapPan = useCallback((position: { x: number, y: number }) => {
      treeRef.current?.handleMinimapPan(position);
  }, []);

  useEffect(() => {
      if (peopleMap.size > 0 && !isInitialAnimationComplete) {
        const params = new URLSearchParams(window.location.search);
        const focusId = params.get('focusedPersonId');
        if (focusId && peopleMap.has(focusId)) {
            const person = peopleMap.get(focusId);
            if (person) handleNodeClick(person);
            // If deep-linking, skip animation and show all nodes.
            const allIds = new Set<string>(peopleMap.keys());
            setVisibleNodeIds(allIds);
            setSpouseVisibleFor(allIds);
            setIsInitialAnimationComplete(true);
        }
      }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peopleMap, isInitialAnimationComplete]);
  
  // Effect to manage the initial reveal animation
  useEffect(() => {
    if (loading || error || roots.length === 0 || isInitialAnimationComplete) {
        if(!loading && !error && !isInitialAnimationComplete && peopleMap.size > 0){
            const allIds = new Set<string>(peopleMap.keys());
            setVisibleNodeIds(allIds);
            setSpouseVisibleFor(allIds);
            setIsInitialAnimationComplete(true);
        }
        return;
    }
    
    // 1. Build a structured list of generations using Breadth-First Search (BFS).
    // This de-duplicates at each level to prevent animation repetitions in complex trees (e.g., cousin marriages).
    const generations: Person[][] = [];
    if (roots.length > 0) {
        let currentGeneration = [...roots];

        while (currentGeneration.length > 0) {
            generations.push(currentGeneration);
            
            const nextGenerationMap = new Map<string, Person>();
            for (const person of currentGeneration) {
                for (const child of person.children) {
                    nextGenerationMap.set(child.id, child);
                }
            }
            currentGeneration = Array.from(nextGenerationMap.values());
        }
    }
    
    // 2. Create a flat list of actions that reveals each person and then their spouse, one by one.
    const actions: { type: 'REVEAL_PEOPLE' | 'REVEAL_SPOUSES'; ids: string[]; focusId: string }[] = [];
    if (generations.length > 0) {
        const visited = new Set<string>();
        for (const generation of generations) {
            for (const person of generation) {
                if (visited.has(person.id)) continue;
                
                // Reveal the person.
                actions.push({ type: 'REVEAL_PEOPLE', ids: [person.id], focusId: person.id });
                visited.add(person.id);

                // If they have a spouse, reveal the spouse immediately after.
                if (person.spouse) {
                    actions.push({ type: 'REVEAL_SPOUSES', ids: [person.id], focusId: person.id });
                }
            }
        }
    }

    const animationDelay = 750;
    let isCancelled = false;
    let timeoutId: number;

    const runAnimation = async () => {
        for (const action of actions) {
            if (isCancelled) break;

            if (action.type === 'REVEAL_PEOPLE') {
                setVisibleNodeIds(prev => new Set([...prev, ...action.ids]));
            } else {
                setSpouseVisibleFor(prev => new Set([...prev, ...action.ids]));
            }
            
            setPersonToFocusForAnimation(action.focusId);

            await new Promise(resolve => {
              timeoutId = window.setTimeout(resolve, animationDelay);
            });
        }
        if (!isCancelled) {
            setIsInitialAnimationComplete(true);
            setPersonToFocusForAnimation(null);
            treeRef.current?.panToTop();
        }
    };

    runAnimation();

    return () => {
        isCancelled = true;
        clearTimeout(timeoutId);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, error, roots, peopleMap, isInitialAnimationComplete]);

  // This effect reliably pans the view AFTER the DOM has been updated with the new node.
  useLayoutEffect(() => {
    if (personToFocusForAnimation) {
        treeRef.current?.panToPerson(personToFocusForAnimation);
    }
  }, [personToFocusForAnimation]);


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
    
    const idsToHighlight = new Set<string>();

    const collectDescendants = (p: Person) => {
        idsToHighlight.add(p.id);
        if (p.spouse) idsToHighlight.add(p.spouse.id);
        p.children.forEach(collectDescendants);
    };
    collectDescendants(person);

    const father = person.fatherID ? peopleMap.get(person.fatherID) : undefined;
    const mother = person.motherID ? peopleMap.get(person.motherID) : undefined;

    if (father) {
      idsToHighlight.add(father.id);
      if (father. spouse) idsToHighlight.add(father.spouse.id);
    }
    if (mother) {
      idsToHighlight.add(mother.id);
      if (mother.spouse) idsToHighlight.add(mother.spouse.id);
    }
    
    setHighlightedIds(idsToHighlight);
  }, [focusedPersonId, peopleMap]);

  const handleNodeClick = useCallback((person: Person) => {
    const fullPerson = peopleMap.get(person.id);
    if (!fullPerson) return;
    setSearchQuery('');

    if (selectedPerson?.id === fullPerson.id) {
        return;
    }

    if (selectedPerson) {
        setSelectedPerson(null);
        setFocusedPersonId(null);
        setTimeout(() => {
            setSelectedPerson(fullPerson);
            setFocusedPersonId(fullPerson.id);
        }, 100);
    } else {
        setSelectedPerson(fullPerson);
        setFocusedPersonId(fullPerson.id);
    }
  }, [peopleMap, selectedPerson]);
  
  const handleFocusToggle = useCallback((person: Person) => {
    if (focusedPersonId === person.id) {
        setFocusedPersonId(null);
        setSelectedPerson(null);
    } else {
        handleNodeClick(person);
    }
  }, [focusedPersonId, handleNodeClick]);

  const handleShowDetails = useCallback((person: Person) => {
    handleNodeClick(person);
  }, [handleNodeClick]);

  const handleCloseDetails = () => {
    setSelectedPerson(null);
  };
  
  const handleClearFocus = useCallback(() => {
      setFocusedPersonId(null);
      setSelectedPerson(null);
      
      if (peopleMap.size > 0) {
        setVisibleNodeIds(new Set());
        setSpouseVisibleFor(new Set());
        setIsInitialAnimationComplete(false);
        setPersonToFocusForAnimation(null);
      }
  }, [peopleMap]);

  const handleSkipAnimation = useCallback(() => {
    const allIds = new Set<string>(peopleMap.keys());
    setVisibleNodeIds(allIds);
    setSpouseVisibleFor(allIds);
    setPersonToFocusForAnimation(null);
    // Setting this to true will stop the animation effect and trigger
    // the FamilyTree to pan to the top overview.
    setIsInitialAnimationComplete(true);
  }, [peopleMap]);
  
  const handleExportPdf = async () => {
      const treeElement = document.querySelector('.tree-content') as HTMLElement;
      if (!treeElement) return;
      
      setIsExporting(true);
      
      const originalTransform = treeElement.style.transform;
      treeElement.style.transform = '';
      await new Promise(resolve => setTimeout(resolve, 100));

      try {
        const canvas = await (window as any).html2canvas(treeElement, {
            scale: 2, 
            backgroundColor: document.documentElement.classList.contains('dark') ? '#0f172a' : '#f8fafc',
            useCORS: true,
            logging: false,
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new (window as any).jspdf.jsPDF({
            orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
            unit: 'px',
            format: [canvas.width, canvas.height],
            hotfixes: ['px_scaling'], 
        });
        
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height, undefined, 'FAST');
        pdf.save("family-tree.pdf");

      } catch (e) {
          console.error("Failed to export PDF", e);
      } finally {
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

    const buildDescendantTree = (person: Person): Person => {
      const fullChildren = person.children.map(child => {
        const childFromMap = peopleMap.get(child.id)!;
        return buildDescendantTree(childFromMap);
      });
      return { ...person, children: fullChildren };
    };

    const focusedPersonWithDescendants = buildDescendantTree(focusedPerson);

    const father = focusedPerson.fatherID ? peopleMap.get(focusedPerson.fatherID) : undefined;
    const mother = focusedPerson.motherID ? peopleMap.get(focusedPerson.motherID) : undefined;
    
    if (!father && !mother) {
        return [focusedPersonWithDescendants];
    }

    const fatherClone = father ? { ...father, children: [focusedPersonWithDescendants], spouse: undefined } : undefined;
    const motherClone = mother ? { ...mother, children: [focusedPersonWithDescendants], spouse: undefined } : undefined;
    
    if (fatherClone && motherClone) {
        fatherClone.spouse = motherClone;
        motherClone.spouse = fatherClone;
    }

    return fatherClone ? [fatherClone] : [motherClone!];
  }, [focusedPersonId, roots, peopleMap]);

  const isAnimating = !isInitialAnimationComplete;

  return (
    <div className="antialiased h-screen w-screen overflow-hidden flex flex-col">
       <header className="flex-shrink-0 bg-white dark:bg-slate-800 shadow-md z-20">
            <div className="container mx-auto px-4 py-3 grid grid-cols-[auto_1fr_auto] items-center gap-4">
                <div className="flex items-center gap-3">
                  <img src={appConfig.logoUrl} alt={`${appConfig.title} Logo`} className="h-8 w-8 object-contain" />
                  <h1 className="hidden sm:inline text-lg sm:text-xl font-bold text-slate-900 dark:text-white">{appConfig.title}</h1>
                </div>
                
                <div className="flex justify-center min-w-0">
                    <div className="flex items-center justify-center gap-4 w-full max-w-7xl">
                        <div className="relative w-full max-w-md">
                            <input
                                type="text"
                                placeholder="Search for a person..."
                                className="w-full h-10 pl-4 pr-4 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => setIsSearchFocused(true)}
                                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)} // Increased delay to allow click
                            />
                            {isSearchFocused && searchResults.length > 0 && (
                                <ul className="absolute top-full mt-2 min-w-full bg-white dark:bg-slate-800 rounded-lg shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700 z-30">
                                    {searchResults.map(person => (
                                        <li key={person.id}>
                                            <button onClick={() => handleNodeClick(person)} className="w-full text-left flex items-center gap-3 p-3 hover:bg-slate-100 dark:hover:bg-slate-700">
                                                <SecureImage name={person.name} src={person.imageUrl} alt={person.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                                                <div>
                                                    <p className="font-semibold whitespace-nowrap text-slate-900 dark:text-white">{person.name}</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">{person.birthDate || ''}</p>
                                                </div>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        
                        {!loading && !error && minimapViewport.contentSize.width > 0 && (
                            <Minimap
                                className="hidden md:flex"
                                containerSize={minimapViewport.containerSize}
                                contentSize={minimapViewport.contentSize}
                                pan={minimapViewport.pan}
                                scale={minimapViewport.scale}
                                roots={displayedRoots}
                                onPan={handleMinimapPan}
                            />
                        )}
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <button onClick={handleClearFocus} title="Reset View" className="p-2 rounded-full text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12a8 8 0 018-8v0a8 8 0 018 8v0a8 8 0 01-8 8v0a8 8 0 01-8-8v0z" /></svg>
                    </button>
                    <button onClick={handleExportPdf} disabled={isExporting} title="Export to PDF" className="p-2 rounded-full text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50">
                        {isExporting ?
                            <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            :
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        }
                    </button>
                    <button onClick={() => setIsHelpVisible(true)} title="Help" className="p-2 rounded-full text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
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
            {isAnimating && !loading && !error && (
              <div className="absolute top-4 right-4 z-20">
                  <button
                      onClick={handleSkipAnimation}
                      className="px-4 py-2 bg-black/60 text-white rounded-full backdrop-blur-sm hover:bg-black/80 transition-colors shadow-lg"
                  >
                      Skip Animation
                  </button>
              </div>
            )}
            {!loading && !error && displayedRoots.length > 0 && (
                <FamilyTree 
                    ref={treeRef}
                    roots={displayedRoots} 
                    onFocusPerson={handleFocusToggle}
                    onShowDetails={handleShowDetails}
                    selectedPersonId={selectedPerson?.id}
                    focusedPersonId={focusedPersonId}
                    peopleMap={peopleMap}
                    highlightedIds={highlightedIds}
                    isInFocusMode={!!focusedPersonId}
                    isSidebarVisible={!!selectedPerson}
                    onViewportUpdate={handleViewportUpdate}
                    visibleNodeIds={visibleNodeIds}
                    spouseVisibleFor={spouseVisibleFor}
                    isAnimating={isAnimating}
                    onResetView={handleClearFocus}
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
            {/* Backdrop for mobile details panel */}
            <div 
                className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-30 transition-opacity md:hidden
                    ${selectedPerson ? 'opacity-100' : 'opacity-0 pointer-events-none'}`
                }
                onClick={handleCloseDetails} 
                aria-hidden="true"
            />
             <PersonDetails 
                person={selectedPerson} 
                onClose={handleCloseDetails}
                onSelectPerson={handleNodeClick}
                peopleMap={peopleMap}
             />
        </main>
        
        {isHelpVisible && <HelpScreen onClose={() => setIsHelpVisible(false)} appConfig={appConfig} dataSource={dataSourceLabel} />}
    </div>
  );
};

export default App;