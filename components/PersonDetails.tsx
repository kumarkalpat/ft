import React from 'react';
import { Person } from '../types';
import { SecureImage } from './SecureImage';
import { DescendantChip } from './DescendantChip';

interface PersonDetailsProps {
  person: Person | null;
  onClose: () => void;
  onSelectPerson: (person: Person) => void;
  peopleMap: Map<string, Person>;
}

const getAge = (birthDate?: string, deathDate?: string): string => {
  if (!birthDate) return '';
  // Appending 'T00:00:00' ensures the date string is parsed in the local timezone, not UTC.
  const start = new Date(`${birthDate}T00:00:00`);
  const end = deathDate ? new Date(`${deathDate}T00:00:00`) : new Date();
  let age = end.getFullYear() - start.getFullYear();
  const m = end.getMonth() - start.getMonth();
  if (m < 0 || (m === 0 && end.getDate() < start.getDate())) {
    age--;
  }
  return age >= 0 ? `(Age ${age})` : '';
};


const DetailItem: React.FC<{ label: string; value?: string }> = ({ label, value }) => {
  if (!value) return null;
  return (
    <div>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-slate-900 dark:text-white whitespace-pre-wrap">{value}</p>
    </div>
  );
};

const RelatedPersonChip: React.FC<{ person?: Person; onClick: (person: Person) => void, label: string }> = ({ person, onClick, label }) => {
    if (!person) return null;
    return (
        <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{label}</p>
            <button onClick={() => onClick(person)} className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors w-full text-left">
                <SecureImage name={person.name} src={person.imageUrl} alt={person.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                <div>
                     <p className="font-semibold text-slate-900 dark:text-white">{person.name}</p>
                     <p className="text-xs text-slate-500 dark:text-slate-400">{person.birthDate} - {person.deathDate || 'Present'}</p>
                </div>
            </button>
        </div>
    );
};

export const PersonDetails: React.FC<PersonDetailsProps> = ({ person, onClose, onSelectPerson, peopleMap }) => {
  const isVisible = !!person;
  
  const father = person?.fatherID ? peopleMap.get(person.fatherID) : undefined;
  const mother = person?.motherID ? peopleMap.get(person.motherID) : undefined;

  const baseClasses = "fixed bg-white dark:bg-slate-800 z-40 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out inset-x-0 bottom-0 max-h-[90vh] rounded-t-2xl md:inset-y-0 md:left-auto md:right-0 md:w-96 md:max-h-full md:rounded-t-none";
  const visibilityClasses = isVisible
    ? "translate-y-0 md:translate-x-0"
    : "translate-y-full md:translate-x-full md:translate-y-0";

  return (
    <div className={`${baseClasses} ${visibilityClasses}`}>
      {person && (
        <>
          {/* Grabber handle for mobile bottom sheet */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1.5 bg-slate-300 dark:bg-slate-600 rounded-full md:hidden" aria-hidden="true" />
          
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 w-8 h-8 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-full z-10 hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center justify-center text-xl"
            aria-label="Close details"
          >
            &times;
          </button>
          
          <div className="flex-grow p-6 pt-14 overflow-y-auto">
            {/* Header section with image and key details */}
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="flex-shrink-0">
                <SecureImage 
                  name={person.name} 
                  src={person.imageUrl} 
                  alt={person.name} 
                  className="w-32 h-32 rounded-full object-cover border-4 border-white dark:border-slate-800 shadow-lg"
                />
              </div>
              <div className="text-center md:text-left">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{person.name}</h2>
                {person.alias && <p className="text-sm text-slate-500 dark:text-slate-400">"{person.alias}"</p>}
                <div className="mt-2 text-sm text-slate-600 dark:text-slate-300 space-y-1">
                  {person.birthDate && (
                    <p><strong>Born:</strong> {person.birthDate} {!person.deathDate && getAge(person.birthDate, person.deathDate)}</p>
                  )}
                   {person.deathDate && (
                    <p><strong>Died:</strong> {person.deathDate} {getAge(person.birthDate, person.deathDate)}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Rest of the details */}
            <div className="mt-8 space-y-4">
                <DetailItem label="Bio" value={person.bio} />
                <DetailItem label="Birth Place" value={person.birthPlace} />
                <DetailItem label="Marriage Date" value={person.marriageDate} />
                <DetailItem label="Marriage Place" value={person.marriagePlace} />

                {(person.bio || person.birthPlace || person.marriageDate || person.marriagePlace) && <hr className="dark:border-slate-700" />}
                
                <div className="grid grid-cols-1 gap-4">
                    {father && <RelatedPersonChip person={father} onClick={onSelectPerson} label="Father" />}
                    {mother && <RelatedPersonChip person={mother} onClick={onSelectPerson} label="Mother" />}
                    {person.spouse && <RelatedPersonChip person={person.spouse} onClick={onSelectPerson} label="Spouse" />}
                </div>
                
                {person.children.length > 0 && (
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Descendants</p>
                        <div className="space-y-2">
                            {person.children.map(child => <DescendantChip key={child.id} person={child} onSelectPerson={onSelectPerson} level={0} />)}
                        </div>
                    </div>
                )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};