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
  visibleNodeIds: Set<string>;
  spouseVisibleFor: Set<string>;
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

export const TreeNode: React.FC<TreeNodeProps> = ({ person, onFocusPerson, onShowDetails, selectedPersonId, highlightedIds, isInFocusMode, visibleNodeIds, spouseVisibleFor }) => {
  const isSelected = person.id === selectedPersonId;
  const isSpouseSelected = person.spouse?.id === selectedPersonId;

  const isNodeHighlighted = highlightedIds.has(person.id) || (person.spouse && highlightedIds.has(person.spouse.id));
  const isDimmed = isInFocusMode && !isNodeHighlighted;
  const isVisible = visibleNodeIds.has(person.id);
  const isSpouseVisible = spouseVisibleFor.has(person.id);
  
  // Conditionally render children only when they are meant to be visible.
  const areChildrenVisible = person.children.length > 0 && person.children.some(child => visibleNodeIds.has(child.id));
  const visibleChildren = person.children.filter(child => visibleNodeIds.has(child.id));

  return (
    // Container for a "family unit". It's an `li` element to work with the CSS line styles.
    <li 
        className={`
          flex flex-col items-center relative 
          transition-[opacity,transform] duration-700 ease-out 
          ${isVisible ? 'scale-100' : 'scale-95 -translate-y-4'} 
          ${isDimmed ? 'opacity-30' : (isVisible ? 'opacity-100' : 'opacity-0')}
        `}
        data-id={person.id}
    >
      
      {/* The person and their spouse */}
      <div className="flex items-center">
        <div
          onClick={() => onFocusPerson(person)}
          onDoubleClick={() => onShowDetails(person)}
          role="button"
          tabIndex={0}
          aria-label={`View details for ${person.name}`}
          className={`
            p-2 rounded-lg cursor-pointer w-40 h-48 flex flex-col items-center text-center justify-start bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700
            transition-[transform,box-shadow,ring-width] duration-200 ease-in-out
            ${isSelected 
              ? 'ring-2 ring-indigo-500 scale-105 shadow-[0_15px_30px_-5px_rgba(0,0,0,0.25)] dark:shadow-[0_15px_30px_-5px_rgba(0,0,0,0.5)]' 
              : 'shadow-[0_8px_16px_rgba(0,0,0,0.15)] dark:shadow-[0_8px_16px_rgba(0,0,0,0.4)] hover:scale-105 hover:shadow-[0_15px_30px_-5px_rgba(0,0,0,0.25)] dark:hover:shadow-[0_15px_30px_-5px_rgba(0,0,0,0.5)]'
            }
          `}
        >
          <SecureImage
            src={person.imageUrl}
            name={person.name}
            alt={person.name}
            className="w-24 h-24 rounded-full object-cover flex-shrink-0 shadow-[0_4px_8px_rgba(0,0,0,0.2)] dark:shadow-[0_4px_8px_rgba(0,0,0,0.5)] border border-slate-200 dark:border-slate-600"
          />
          <div className="mt-1 flex-grow flex flex-col justify-center">
            <p className="font-semibold text-sm w-full" title={person.name}>
              {person.name}
            </p>
            {person.alias && (
              <p className="text-xs text-slate-500 dark:text-slate-400 italic" title={person.alias}>
                "{person.alias}"
              </p>
            )}
            {person.birthDate && (
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                {person.deathDate
                  ? `${new Date(person.birthDate).getFullYear()} - ${new Date(person.deathDate).getFullYear()} ${getAge(person.birthDate, person.deathDate)}`
                  : `${new Date(person.birthDate).getFullYear()} ${getAge(person.birthDate, person.deathDate)}`
                }
              </p>
            )}
          </div>
        </div>

        {person.spouse && (
           // This container animates its width to smoothly make space for the spouse card.
          <div className={`
            overflow-hidden transition-[max-width,margin] duration-700 ease-in-out
            ${isSpouseVisible ? 'max-w-40 ml-2' : 'max-w-0 ml-0'}
          `}>
             {/* This inner div handles the visual animation of the card itself. */}
            <div
              onClick={() => onFocusPerson(person.spouse!)}
              onDoubleClick={() => onShowDetails(person.spouse!)}
              role="button"
              tabIndex={0}
              aria-label={`View details for ${person.spouse.name}`}
              className={`
                p-2 rounded-lg cursor-pointer w-40 h-48 flex flex-col items-center text-center justify-start bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700
                transition-[opacity,transform,box-shadow,ring-width] duration-500 ease-out
                ${isSpouseVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
                ${isSpouseSelected 
                  ? 'ring-2 ring-indigo-500 scale-105 shadow-[0_15px_30px_-5px_rgba(0,0,0,0.25)] dark:shadow-[0_15px_30px_-5px_rgba(0,0,0,0.5)]' 
                  : 'shadow-[0_8px_16px_rgba(0,0,0,0.15)] dark:shadow-[0_8px_16px_rgba(0,0,0,0.4)] hover:scale-105 hover:shadow-[0_15px_30px_-5px_rgba(0,0,0,0.25)] dark:hover:shadow-[0_15px_30px_-5px_rgba(0,0,0,0.5)]'
                }
              `}
            >
              <SecureImage
                src={person.spouse.imageUrl}
                name={person.spouse.name}
                alt={person.spouse.name}
                className="w-24 h-24 rounded-full object-cover flex-shrink-0 shadow-[0_4px_8px_rgba(0,0,0,0.2)] dark:shadow-[0_4px_8px_rgba(0,0,0,0.5)] border border-slate-200 dark:border-slate-600"
              />
              <div className="mt-1 flex-grow flex flex-col justify-center">
                  <p className="font-semibold text-sm w-full" title={person.spouse.name}>
                  {person.spouse.name}
                  </p>
                  {person.spouse.alias && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 italic" title={person.spouse.alias}>
                      "{person.spouse.alias}"
                    </p>
                  )}
                  {person.spouse.birthDate && (
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                      {person.spouse.deathDate
                        ? `${new Date(person.spouse.birthDate).getFullYear()} - ${new Date(person.spouse.deathDate).getFullYear()} ${getAge(person.spouse.birthDate, person.spouse.deathDate)}`
                        : `${new Date(person.spouse.birthDate).getFullYear()} ${getAge(person.spouse.birthDate, person.spouse.deathDate)}`
                      }
                  </p>
                  )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* The children of the person/couple */}
      {areChildrenVisible && (
        <ul>
          {visibleChildren.map((child) => (
            <TreeNode
              key={child.id}
              person={child}
              onFocusPerson={onFocusPerson}
              onShowDetails={onShowDetails}
              selectedPersonId={selectedPersonId}
              highlightedIds={highlightedIds}
              isInFocusMode={isInFocusMode}
              visibleNodeIds={visibleNodeIds}
              spouseVisibleFor={spouseVisibleFor}
            />
          ))}
        </ul>
      )}
    </li>
  );
};