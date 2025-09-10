import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Person } from '../types';
import { TreeNode } from './TreeNode';

interface FamilyTreeProps {
  roots: Person[];
  onSelectPerson: (person: Person) => void;
  selectedPersonId?: string;
  highlightedIds: Set<string>;
  isInFocusMode: boolean;
}

export const FamilyTree: React.FC<FamilyTreeProps> = ({ roots, onSelectPerson, selectedPersonId, highlightedIds, isInFocusMode }) => {
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const fitAndCenterTree = useCallback(() => {
    if (!containerRef.current || !contentRef.current || contentRef.current.offsetWidth === 0) {
      setTimeout(() => fitAndCenterTree(), 100);
      return;
    }

    const containerWidth = containerRef.current.offsetWidth;
    const containerHeight = containerRef.current.offsetHeight;
    const contentWidth = contentRef.current.offsetWidth;
    const contentHeight = contentRef.current.offsetHeight;

    if (contentWidth === 0 || contentHeight === 0) return;

    const padding = 80;
    const scaleX = (containerWidth - padding) / contentWidth;
    const scaleY = (containerHeight - padding) / contentHeight;
    const newScale = Math.min(scaleX, scaleY, 1);
    const newX = (containerWidth - contentWidth * newScale) / 2;
    const newY = Math.max(padding, (containerHeight - contentHeight * newScale) / 2);

    setScale(newScale);
    setPan({ x: newX, y: newY });
  }, []);

  const panToPerson = useCallback((personId: string) => {
    if (!containerRef.current || !contentRef.current) return;
    
    const personNode = contentRef.current.querySelector(`[data-id='${personId}']`) as HTMLElement;
    if (!personNode) return;

    const container = containerRef.current;
    
    const newScale = 1.0;
    const newX = (container.offsetWidth / 2) - (personNode.offsetLeft + personNode.offsetWidth / 2) * newScale;
    const newY = (container.offsetHeight / 3) - (personNode.offsetTop + personNode.offsetHeight / 2) * newScale;

    setScale(newScale);
    setPan({ x: newX, y: newY });
  }, []);

  useEffect(() => {
    if (roots.length > 0 && !isInFocusMode) {
      fitAndCenterTree();
    }
  }, [roots, isInFocusMode, fitAndCenterTree]);

  useEffect(() => {
      if (selectedPersonId) {
          // Delay to allow DOM to update if a focus change caused a re-render
          setTimeout(() => panToPerson(selectedPersonId), 50);
      }
  }, [selectedPersonId, panToPerson]);


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
        className="inline-flex tree tree-content"
        style={{ 
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transformOrigin: 'top left',
            cursor: isPanning ? 'grabbing' : 'grab',
            transition: isPanning ? 'none' : 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)',
        }}
      >
        <ul className="flex justify-center items-start p-16">
            {roots.map(root => (
                <TreeNode 
                  key={root.id} 
                  person={root} 
                  onSelectPerson={onSelectPerson} 
                  selectedPersonId={selectedPersonId}
                  highlightedIds={highlightedIds}
                  isInFocusMode={isInFocusMode}
                />
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