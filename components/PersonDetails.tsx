import React from 'react';
import { Person } from '../types';
import { SecureImage } from './SecureImage';

interface PersonDetailsProps {
  person: Person | null;
  onClose: () => void;
  onSelectPerson: (person: Person) => void;
  peopleMap: Map<string, Person>;
}

const getAge = (birthDate?: string, deathDate?: string): string => {
  if (!birthDate) return '';
  const start = new Date(birthDate);
  const end = deathDate ? new Date(deathDate) : new Date();
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


  const baseClasses = "fixed inset-0 bg-white dark:bg-slate-800 z-30 flex flex-col md:absolute md:top-0 md:right-0 md:h-full md:w-96 md:inset-auto md:shadow-2xl transition-transform duration-300 ease-in-out";
  const visibilityClasses = isVisible
    ? "translate-y-0 md:translate-x-0"
    : "translate-y-full md:translate-y-0 md:translate-x-full";


  return (
    <div className={`${baseClasses} ${visibilityClasses}`}>
      {person && (
        <>
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-full z-10 hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center justify-center text-xl">&times;</button>
          
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
                    <p><strong>Born:</strong> {person.birthDate} {getAge(person.birthDate, person.deathDate)}</p>
                  )}
                   {person.deathDate && (
                    <p><strong>Died:</strong> {person.deathDate}</p>
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
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Children</p>
                        <div className="space-y-2">
                            {person.children.map(child => <RelatedPersonChip key={child.id} person={child} onClick={onSelectPerson} label="" />)}
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