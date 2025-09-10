// FIX: Created the TreeNode component which was missing. This component recursively renders a person, their spouse, and their children to build the family tree structure.
import React from 'react';
import { Person } from '../types';
import { SecureImage } from './SecureImage';

interface TreeNodeProps {
  person: Person;
  onSelectPerson: (person: Person) => void;
  selectedPersonId?: string;
}

export const TreeNode: React.FC<TreeNodeProps> = ({ person, onSelectPerson, selectedPersonId }) => {
  const isSelected = person.id === selectedPersonId;
  const isSpouseSelected = person.spouse?.id === selectedPersonId;

  return (
    // Container for a "family unit" (person/couple + their children)
    <div className="flex flex-col items-center">
      
      {/* The person and their spouse */}
      <div className="flex items-center gap-4">
        <div
          onClick={() => onSelectPerson(person)}
          className={`
            p-2 rounded-lg cursor-pointer transition-all w-32 flex flex-col items-center text-center
            ${isSelected ? 'bg-indigo-200 dark:bg-indigo-800 ring-2 ring-indigo-500 scale-105' : 'bg-white dark:bg-slate-800 shadow-md hover:shadow-lg hover:scale-105'}
          `}
        >
          <SecureImage
            src={person.imageUrl}
            name={person.name}
            alt={person.name}
            className="w-20 h-20 rounded-full object-cover"
          />
          <p className="mt-2 font-semibold text-sm truncate w-full" title={person.name}>
            {person.name}
          </p>
        </div>

        {person.spouse && (
          <div
            onClick={() => onSelectPerson(person.spouse!)}
            className={`
              p-2 rounded-lg cursor-pointer transition-all w-32 flex flex-col items-center text-center
              ${isSpouseSelected ? 'bg-indigo-200 dark:bg-indigo-800 ring-2 ring-indigo-500 scale-105' : 'bg-white dark:bg-slate-800 shadow-md hover:shadow-lg hover:scale-105'}
            `}
          >
            <SecureImage
              src={person.spouse.imageUrl}
              name={person.spouse.name}
              alt={person.spouse.name}
              className="w-20 h-20 rounded-full object-cover"
            />
            <p className="mt-2 font-semibold text-sm truncate w-full" title={person.spouse.name}>
              {person.spouse.name}
            </p>
          </div>
        )}
      </div>

      {/* The children of the person/couple */}
      {person.children && person.children.length > 0 && (
        <div className="flex justify-center items-start gap-8 pt-12">
          {person.children.map((child) => (
            <TreeNode
              key={child.id}
              person={child}
              onSelectPerson={onSelectPerson}
              selectedPersonId={selectedPersonId}
            />
          ))}
        </div>
      )}
    </div>
  );
};
