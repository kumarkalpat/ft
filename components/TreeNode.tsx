import React from 'react';
import { Person } from '../types';
import { SecureImage } from './SecureImage';

interface TreeNodeProps {
  person: Person;
  onFocusPerson: (person: Person) => void;
  onShowDetails: (person: Person) => void;
  selectedPersonId?: string;
  highlightedIds: Set<string>;
  isInFocusMode: boolean;
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
  return age >= 0 ? `(${age})` : '';
};

export const TreeNode: React.FC<TreeNodeProps> = ({ person, onFocusPerson, onShowDetails, selectedPersonId, highlightedIds, isInFocusMode }) => {
  const isSelected = person.id === selectedPersonId;
  const isSpouseSelected = person.spouse?.id === selectedPersonId;

  const isNodeHighlighted = highlightedIds.has(person.id) || (person.spouse && highlightedIds.has(person.spouse.id));
  const isDimmed = isInFocusMode && !isNodeHighlighted;

  return (
    // Container for a "family unit". It's an `li` element to work with the CSS line styles.
    <li 
        className={`flex flex-col items-center relative transition-opacity duration-500 ${isDimmed ? 'opacity-30' : 'opacity-100'}`}
        data-id={person.id}
    >
      
      {/* The person and their spouse */}
      <div className="flex items-center gap-2 sm:gap-4">
        <div
          onClick={() => onFocusPerson(person)}
          onDoubleClick={() => onShowDetails(person)}
          role="button"
          tabIndex={0}
          aria-label={`View details for ${person.name}`}
          className={`
            p-2 rounded-lg cursor-pointer transition-all w-36 sm:w-40 min-h-[9rem] sm:min-h-[10rem] flex flex-col items-center text-center justify-center bg-white dark:bg-slate-800
            ${isSelected ? 'ring-2 ring-indigo-500 scale-105 shadow-xl' : 'shadow-md hover:shadow-lg hover:scale-105'}
          `}
        >
          <SecureImage
            src={person.imageUrl}
            name={person.name}
            alt={person.name}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover"
          />
          <div className="mt-2 flex-grow flex flex-col justify-center">
            <p className="font-semibold text-xs sm:text-sm w-full" title={person.name}>
              {person.name}
            </p>
            {person.alias && (
              <p className="text-xs text-slate-500 dark:text-slate-400 italic" title={person.alias}>
                "{person.alias}"
              </p>
            )}
            {person.birthDate && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {person.deathDate
                  ? `${new Date(person.birthDate).getFullYear()} - ${new Date(person.deathDate).getFullYear()} ${getAge(person.birthDate, person.deathDate)}`
                  : `${new Date(person.birthDate).getFullYear()} ${getAge(person.birthDate, person.deathDate)}`
                }
              </p>
            )}
          </div>
        </div>

        {person.spouse && (
          <div
            onClick={() => onFocusPerson(person.spouse!)}
            onDoubleClick={() => onShowDetails(person.spouse!)}
            role="button"
            tabIndex={0}
            aria-label={`View details for ${person.spouse.name}`}
            className={`
              p-2 rounded-lg cursor-pointer transition-all w-36 sm:w-40 min-h-[9rem] sm:min-h-[10rem] flex flex-col items-center text-center justify-center bg-white dark:bg-slate-800
              ${isSpouseSelected ? 'ring-2 ring-indigo-500 scale-105 shadow-xl' : 'shadow-md hover:shadow-lg hover:scale-105'}
            `}
          >
            <SecureImage
              src={person.spouse.imageUrl}
              name={person.spouse.name}
              alt={person.spouse.name}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover"
            />
             <div className="mt-2 flex-grow flex flex-col justify-center">
                <p className="font-semibold text-xs sm:text-sm w-full" title={person.spouse.name}>
                {person.spouse.name}
                </p>
                {person.spouse.alias && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic" title={person.spouse.alias}>
                    "{person.spouse.alias}"
                  </p>
                )}
                {person.spouse.birthDate && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {person.spouse.deathDate
                      ? `${new Date(person.spouse.birthDate).getFullYear()} - ${new Date(person.spouse.deathDate).getFullYear()} ${getAge(person.spouse.birthDate, person.spouse.deathDate)}`
                      : `${new Date(person.spouse.birthDate).getFullYear()} ${getAge(person.spouse.birthDate, person.spouse.deathDate)}`
                    }
                </p>
                )}
            </div>
          </div>
        )}
      </div>

      {/* The children of the person/couple */}
      {person.children && person.children.length > 0 && (
        <ul>
          {person.children.map((child) => (
            <TreeNode
              key={child.id}
              person={child}
              onFocusPerson={onFocusPerson}
              onShowDetails={onShowDetails}
              selectedPersonId={selectedPersonId}
              highlightedIds={highlightedIds}
              isInFocusMode={isInFocusMode}
            />
          ))}
        </ul>
      )}
    </li>
  );
};