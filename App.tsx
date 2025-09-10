import React, { useState, useCallback, useEffect } from 'react';
import { useFamilyTree } from './hooks/useFamilyTree';
import { FamilyTree } from './components/FamilyTree';
import { PersonDetails } from './components/PersonDetails';
import { LoginScreen } from './components/LoginScreen';
import { Person } from './types';

const fallbackData = `id,name,gender,fatherID,motherID,spouseID,imageUrl,birthDate,bio
1,John Doe,Male,,,2,https://ui-avatars.com/api/?name=John+Doe,1950-01-01,Founder of the Doe family.
2,Jane Smith,Female,,,1,https://ui-avatars.com/api/?name=Jane+Smith,1952-05-10,Matriarch of the Doe family.
3,Peter Doe,Male,1,2,4,https://ui-avatars.com/api/?name=Peter+Doe,1975-03-20,Eldest son of John and Jane.
4,Mary Johnson,Female,,,3,https://ui-avatars.com/api/?name=Mary+Johnson,1976-11-15,Wife of Peter Doe.
5,Susan Doe,Female,1,2,,https://ui-avatars.com/api/?name=Susan+Doe,1980-08-05,Youngest daughter of John and Jane.
6,David Doe,Male,3,4,,,https://ui-avatars.com/api/?name=David+Doe,2000-06-25,Son of Peter and Mary.
`;

const DEFAULT_SHEET_URL = 'https://docs.google.com/spreadsheets/d/your-sheet-id-here/export?format=csv';

const App: React.FC = () => {
  const [sheetUrl, setSheetUrl] = useState<string | null>(null);
  const [isLoadingApp, setIsLoadingApp] = useState(true);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

  useEffect(() => {
    const storedUrl = localStorage.getItem('sheetUrl');
    setSheetUrl(storedUrl);
    setIsLoadingApp(false);
  }, []);

  const { roots, peopleMap, loading, error } = useFamilyTree(sheetUrl ?? '', fallbackData);

  const handleSetSheetUrl = (url: string) => {
    if (url) {
      localStorage.setItem('sheetUrl', url);
    } else {
      localStorage.removeItem('sheetUrl');
    }
    setSheetUrl(url);
    setSelectedPerson(null);
  };
  
  const handleLogout = () => {
      localStorage.removeItem('sheetUrl');
      setSheetUrl(null);
      setSelectedPerson(null);
  };

  const handleSelectPerson = useCallback((person: Person) => {
    const fullPerson = peopleMap.get(person.id);
    setSelectedPerson(fullPerson || null);
  }, [peopleMap]);

  const handleCloseDetails = () => {
    setSelectedPerson(null);
  };

  if (isLoadingApp) {
      return <div className="h-screen w-screen bg-slate-50 dark:bg-slate-900" />;
  }

  if (sheetUrl === null) {
      return <LoginScreen onSetSheetUrl={handleSetSheetUrl} initialUrl={DEFAULT_SHEET_URL} />;
  }

  return (
    <div className="font-sans antialiased text-slate-900 bg-slate-50 dark:bg-slate-900 dark:text-white h-screen w-screen overflow-hidden flex flex-col">
       <header className="flex-shrink-0 bg-white dark:bg-slate-800 shadow-md z-20">
            <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                <h1 className="text-xl font-bold">Family Tree Viewer</h1>
                <button 
                    onClick={handleLogout}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    Change Sheet
                </button>
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
            {!loading && !error && roots.length > 0 && (
                <FamilyTree roots={roots} onSelectPerson={handleSelectPerson} selectedPersonId={selectedPerson?.id} />
            )}
            {!loading && !error && roots.length === 0 && (
                 <div className="absolute inset-0 flex items-center justify-center z-10 p-4">
                    <div className="text-center text-slate-500 dark:text-slate-400">
                        <p className="text-lg">No family data found.</p>
                        <p className="text-sm">Please check your Google Sheet URL and ensure the data format is correct.</p>
                    </div>
                </div>
            )}
             <PersonDetails 
                person={selectedPerson} 
                onClose={handleCloseDetails}
                onSelectPerson={handleSelectPerson}
                peopleMap={peopleMap}
             />
        </main>
    </div>
  );
};

export default App;