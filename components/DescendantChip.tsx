import React from 'react';
import { Person } from '../types';
import { SecureImage } from './SecureImage';

interface DescendantChipProps {
  person: Person;
  onSelectPerson: (person: Person) => void;
  level: number;
}

export const DescendantChip: React.FC<DescendantChipProps> = ({ person, onSelectPerson, level }) => {
  return (
    <div style={{ paddingLeft: `${level * 1.25}rem` }}>
      <button onClick={() => onSelectPerson(person)} className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors w-full text-left">
        <SecureImage name={person.name} src={person.imageUrl} alt={person.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
        <div>
          <p className="font-semibold text-slate-900 dark:text-white">{person.name}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{person.birthDate} - {person.deathDate || 'Present'}</p>
        </div>
      </button>
      {person.children && person.children.length > 0 && (
        <div className="space-y-2 pt-1">
          {person.children.map(child => (
            <DescendantChip key={child.id} person={child} onSelectPerson={onSelectPerson} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};
