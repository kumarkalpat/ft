import React from 'react';
import { Person } from '../types';

interface MinimapNodeProps {
  person: Person;
}

export const MinimapNode: React.FC<MinimapNodeProps> = React.memo(({ person }) => {
  return (
    // The li element's padding is crucial for the CSS connecting lines to have space
    <li className="flex flex-col items-center relative p-[40px_1rem_0_1rem]">
      {/* Container for the person and spouse nodes */}
      <div className="flex items-center gap-4">
        {/* Person representation */}
        <div className="w-40 h-10 bg-slate-300 dark:bg-slate-500 rounded-lg" />
        
        {/* Spouse representation */}
        {person.spouse && (
          <div className="w-40 h-10 bg-slate-300 dark:bg-slate-500 rounded-lg" />
        )}
      </div>

      {/* Recursively render children */}
      {person.children && person.children.length > 0 && (
        <ul>
          {person.children.map((child) => (
            <MinimapNode key={child.id} person={child} />
          ))}
        </ul>
      )}
    </li>
  );
});