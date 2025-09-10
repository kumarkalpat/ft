import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Person } from '../types';
import { TreeNode } from './TreeNode';

interface FamilyTreeProps {
  roots: Person[];
  onSelectPerson: (person: Person) => void;
  selectedPersonId?: string;
}

export const FamilyTree: React.FC<FamilyTreeProps> = ({ roots, onSelectPerson, selectedPersonId }) => {
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const fitAndCenterTree = useCallback(() => {
    if (!containerRef.current || !contentRef.current || contentRef.current.offsetWidth === 0) {
      // If refs aren't ready or content has no width, try again shortly.
      // This handles cases where the tree renders after the effect runs.
      setTimeout(fitAndCenterTree, 100);
      return;
    }

    const containerWidth = containerRef.current.offsetWidth;
    const containerHeight = containerRef.current.offsetHeight;
    const contentWidth = contentRef.current.offsetWidth;
    const contentHeight = contentRef.current.offsetHeight;

    if (contentWidth === 0 || contentHeight === 0) return;

    const padding = 80; // Add some padding around the tree

    // Calculate the optimal scale to fit the content within the container
    const scaleX = (containerWidth - padding) / contentWidth;
    const scaleY = (containerHeight - padding) / contentHeight;
    const newScale = Math.min(scaleX, scaleY, 1); // Cap at 1 to avoid zooming in on small trees

    // Calculate the position to center the scaled content
    const newX = (containerWidth - contentWidth * newScale) / 2;
    const newY = (containerHeight - contentHeight * newScale) / 2;

    setScale(newScale);
    setPan({ x: newX, y: newY });
  }, []);

  useEffect(() => {
    if (roots.length > 0) {
      fitAndCenterTree();
    }
  }, [roots, fitAndCenterTree]);


  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = 0.1;
    const newScale = e.deltaY > 0 ? scale * (1 - zoomFactor) : scale * (1 + zoomFactor);
    setScale(Math.max(0.2, Math.min(newScale, 3)));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsPanning(true);
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleMouseLeave = () => {
    setIsPanning(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan(prevPan => ({
        x: prevPan.x + e.movementX,
        y: prevPan.y + e.movementY,
      }));
    }
  };
  
  const zoomIn = () => setScale(s => Math.min(s * 1.2, 3));
  const zoomOut = () => setScale(s => Math.max(s / 1.2, 0.2));
  const reset = () => {
    fitAndCenterTree();
  };

  return (
    <div 
        ref={containerRef}
        className="w-full h-full bg-slate-100 dark:bg-slate-900/50 overflow-hidden relative select-none"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
    >
      <div 
        ref={contentRef}
        className="inline-flex tree"
        style={{ 
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transformOrigin: 'top left',
            cursor: isPanning ? 'grabbing' : 'grab',
            transition: isPanning ? 'none' : 'transform 0.1s ease-out',
        }}
      >
        <ul className="flex justify-center items-start p-16">
            {roots.map(root => (
                <TreeNode key={root.id} person={root} onSelectPerson={onSelectPerson} selectedPersonId={selectedPersonId} />
            ))}
        </ul>
      </div>
      
      <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2">
            <button onClick={zoomIn} className="w-10 h-10 bg-white dark:bg-slate-700 rounded-full shadow-md text-xl font-bold flex items-center justify-center">+</button>
            <button onClick={zoomOut} className="w-10 h-10 bg-white dark:bg-slate-700 rounded-full shadow-md text-xl font-bold flex items-center justify-center">-</button>
            <button onClick={reset} className="w-10 h-10 bg-white dark:bg-slate-700 rounded-full shadow-md text-sm flex items-center justify-center">Reset</button>
      </div>
    </div>
  );
};