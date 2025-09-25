import React, { useMemo, useState, useEffect } from 'react';
import { Person } from '../types';
import { SecureImage } from './SecureImage';

// Define the structure for a calculated event
interface CalculatedEvent {
  id: string;
  names: string[];
  imageUrls: (string | undefined)[];
  type: 'Birthday' | 'Anniversary';
  date: Date;
  daysUntil: number;
  description: string; // e.g., "50th Anniversary" or "" for birthdays
  ageTurning?: number; // To show the age they are turning
}

// Props for the component
interface EventsScreenProps {
  onClose: () => void;
  peopleMap: Map<string, Person>;
}

const getDaysUntilText = (days: number) => {
  if (days < 0) return ""; // Should not happen with current logic
  if (days === 0) return "Today!";
  if (days === 1) return "Tomorrow";
  return `in ${days} days`;
};

export const EventsScreen: React.FC<EventsScreenProps> = ({ onClose, peopleMap }) => {
  const [activeTab, setActiveTab] = useState<'birthdays' | 'anniversaries'>('birthdays');
  
  const { birthdays, anniversaries } = useMemo(() => {
    const birthdayEvents: CalculatedEvent[] = [];
    const anniversaryEvents: CalculatedEvent[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day

    const oneYearFromNow = new Date(today);
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    
    const processedMarriages = new Set<string>();

    peopleMap.forEach(person => {
      // 1. Calculate Birthdays
      if (person.birthDate && !person.deathDate) {
        try {
          // Appending 'T00:00:00' ensures the date string is parsed in the local timezone, not UTC.
          const birthDate = new Date(`${person.birthDate}T00:00:00`);
          if (isNaN(birthDate.getTime())) throw new Error("Invalid birth date");
          
          let nextBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
          if (nextBirthday < today) {
            nextBirthday.setFullYear(today.getFullYear() + 1);
          }
          
          if (nextBirthday < oneYearFromNow) {
            const diffTime = nextBirthday.getTime() - today.getTime();
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
            const ageTurning = nextBirthday.getFullYear() - birthDate.getFullYear(); // Calculate the new age

            birthdayEvents.push({
              id: person.id,
              names: [person.name],
              imageUrls: [person.imageUrl],
              type: 'Birthday',
              date: nextBirthday,
              daysUntil: diffDays,
              description: '', // Remove individual birthday labels
              ageTurning, // Add the calculated age
            });
          }
        } catch(e) {
          console.warn(`Could not parse birth date for ${person.name}: ${person.birthDate}`);
        }
      }

      // 2. Calculate Anniversaries
      if (person.marriageDate && person.spouse && !processedMarriages.has(person.id)) {
        try {
          const spouse = person.spouse;
          // Appending 'T00:00:00' ensures the date string is parsed in the local timezone, not UTC.
          const marriageDate = new Date(`${person.marriageDate}T00:00:00`);
          if (isNaN(marriageDate.getTime())) throw new Error("Invalid marriage date");
          const marriageYear = marriageDate.getFullYear();

          let nextAnniversary = new Date(today.getFullYear(), marriageDate.getMonth(), marriageDate.getDate());
          if (nextAnniversary < today) {
              nextAnniversary.setFullYear(today.getFullYear() + 1);
          }

          if (nextAnniversary < oneYearFromNow) {
              const diffTime = nextAnniversary.getTime() - today.getTime();
              const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
              const yearsMarried = nextAnniversary.getFullYear() - marriageYear;
              
              let suffix = 'th';
              const lastDigit = yearsMarried % 10;
              const lastTwoDigits = yearsMarried % 100;
              if (lastDigit === 1 && lastTwoDigits !== 11) suffix = 'st';
              else if (lastDigit === 2 && lastTwoDigits !== 12) suffix = 'nd';
              else if (lastDigit === 3 && lastTwoDigits !== 13) suffix = 'rd';

              anniversaryEvents.push({
                  id: `${person.id}-${spouse.id}-anniversary`,
                  names: [person.name, spouse.name],
                  imageUrls: [person.imageUrl, spouse.imageUrl],
                  type: 'Anniversary',
                  date: nextAnniversary,
                  daysUntil: diffDays,
                  description: `${yearsMarried}${suffix} Anniversary`,
              });
              
              processedMarriages.add(person.id);
              processedMarriages.add(spouse.id);
          }
        } catch(e) {
            console.warn(`Could not parse marriage date for ${person.name}: ${person.marriageDate}`);
        }
      }
    });

    birthdayEvents.sort((a, b) => a.daysUntil - b.daysUntil);
    anniversaryEvents.sort((a, b) => a.daysUntil - b.daysUntil);

    return { birthdays: birthdayEvents, anniversaries: anniversaryEvents };
  }, [peopleMap]);
  
  useEffect(() => {
    // Intelligently set the initial active tab. If there are no birthdays but
    // there are anniversaries, switch to the anniversaries tab by default.
    if (birthdays.length === 0 && anniversaries.length > 0) {
        setActiveTab('anniversaries');
    }
  }, [birthdays, anniversaries]);


  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex-shrink-0 p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="flex-shrink-0 w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
             </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Upcoming Birthdays and Anniversaries</h2>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center justify-center text-xl"
            aria-label="Close events"
          >
            &times;
          </button>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex-shrink-0 border-b border-slate-200 dark:border-slate-700">
            <nav className="flex -mb-px px-6" aria-label="Tabs">
                <button
                    onClick={() => setActiveTab('birthdays')}
                    className={`py-3 px-1 border-b-2 font-medium text-base transition-colors ${
                        activeTab === 'birthdays'
                        ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                        : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                    aria-current={activeTab === 'birthdays' ? 'page' : undefined}
                >
                    Birthdays
                    <span className="ml-2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full px-2.5 py-1 text-xs font-bold">{birthdays.length}</span>
                </button>
                <button
                    onClick={() => setActiveTab('anniversaries')}
                    className={`ml-8 py-3 px-1 border-b-2 font-medium text-base transition-colors ${
                        activeTab === 'anniversaries'
                        ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                        : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                    aria-current={activeTab === 'anniversaries' ? 'page' : undefined}
                >
                    Anniversaries
                    <span className="ml-2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full px-2.5 py-1 text-xs font-bold">{anniversaries.length}</span>
                </button>
            </nav>
        </div>

        <div className="flex-grow p-6 overflow-y-auto">
          {birthdays.length === 0 && anniversaries.length === 0 ? (
            <div className="text-center text-slate-500 dark:text-slate-400 py-10">
              <p className="text-lg font-medium">No upcoming events</p>
              <p className="mt-1">There are no birthdays or anniversaries in the next year.</p>
            </div>
          ) : (
            <>
              {activeTab === 'birthdays' && (
                  birthdays.length > 0 ? (
                    <ul className="space-y-3">
                      {birthdays.map(event => (
                        <li key={event.id} className="p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <SecureImage
                              name={event.names[0]}
                              src={event.imageUrls[0]}
                              alt={event.names[0]}
                              className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                            />
                            <div className="truncate">
                              <p className="text-slate-800 dark:text-slate-200 text-base font-semibold truncate">{event.names[0]}</p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-2">
                            <p className="font-semibold text-slate-900 dark:text-white">{event.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              {event.ageTurning ? `${event.ageTurning} ${getDaysUntilText(event.daysUntil).toLowerCase()}` : getDaysUntilText(event.daysUntil)}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                     <div className="text-center text-slate-500 dark:text-slate-400 py-10">
                        <p>No upcoming birthdays in the next year.</p>
                     </div>
                  )
              )}

              {activeTab === 'anniversaries' && (
                   anniversaries.length > 0 ? (
                    <ul className="space-y-3">
                      {anniversaries.map(event => (
                        <li key={event.id} className="p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                              <div className="flex -space-x-4 flex-shrink-0">
                                  {event.imageUrls.map((url, index) => (
                                      <SecureImage
                                        key={`${event.id}-${index}`}
                                        name={event.names[index]}
                                        src={url}
                                        alt={event.names[index]}
                                        className="w-12 h-12 rounded-full object-cover ring-2 ring-white dark:ring-slate-800"
                                      />
                                  ))}
                              </div>
                              <div className="truncate">
                                  <p className="font-bold text-sm truncate text-rose-600 dark:text-rose-400">{event.description}</p>
                                  <p className="text-slate-800 dark:text-slate-200 text-base truncate">{event.names.join(' & ')}</p>
                              </div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-2">
                              <p className="font-semibold text-slate-900 dark:text-white">{event.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                              <p className="text-sm text-slate-500 dark:text-slate-400">{getDaysUntilText(event.daysUntil)}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                     <div className="text-center text-slate-500 dark:text-slate-400 py-10">
                        <p>No upcoming anniversaries in the next year.</p>
                     </div>
                  )
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
