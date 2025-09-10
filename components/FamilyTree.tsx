import React, { useState, useRef, useLayoutEffect, useCallback } from 'react';
import { Person } from '../types';
import { TreeNode } from './TreeNode';

interface FamilyTreeProps {
  roots: Person[];
  onFocusPerson: (person: Person) => void;
  onShowDetails: (person: Person) => void;
  selectedPersonId?: string;
  highlightedIds: Set<string>;
  isInFocusMode: boolean;
}

export const FamilyTree: React.FC<FamilyTreeProps> = ({ roots, onFocusPerson, onShowDetails, selectedPersonId, highlightedIds, isInFocusMode }) => {
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Refs for touch interactions
  const lastPanPosition = useRef<{ x: number, y: number } | null>(null);
  const lastPinchDistance = useRef<number | null>(null);


  const fitAndCenterTree = useCallback(() => {
    if (!containerRef.current || !contentRef.current) return;
    
    const containerWidth = containerRef.current.offsetWidth;
    const containerHeight = containerRef.current.offsetHeight;
    const contentWidth = contentRef.current.scrollWidth;
    const contentHeight = contentRef.current.scrollHeight;

    if (contentWidth === 0 || contentHeight === 0) {
      requestAnimationFrame(fitAndCenterTree);
      return;
    }

    const padding = 80;
    const scaleX = (containerWidth - padding) / contentWidth;
    const scaleY = (containerHeight - padding) / contentHeight;
    const newScale = Math.min(scaleX, scaleY, 1);

    const newX = (containerWidth - contentWidth * newScale) / 2;
    const newY = 20;
    
    if (isNaN(newScale) || isNaN(newX) || isNaN(newY)) {
        return;
    }

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
    const newY = (container.offsetHeight / 2) - (personNode.offsetTop + personNode.offsetHeight / 2) * newScale;

    setScale(newScale);
    setPan({ x: newX, y: newY });
  }, []);

  useLayoutEffect(() => {
    if (roots.length > 0 && !isInFocusMode) {
      fitAndCenterTree();
    }
    
    window.addEventListener('resize', fitAndCenterTree);
    return () => window.removeEventListener('resize', fitAndCenterTree);
  }, [roots, isInFocusMode, fitAndCenterTree]);

  useLayoutEffect(() => {
      if (selectedPersonId) {
          setTimeout(() => panToPerson(selectedPersonId), 50);
      }
  }, [selectedPersonId, panToPerson]);


  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const zoomFactor = 0.1;
    
    const mousePoint = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const contentPoint = { x: (mousePoint.x - pan.x) / scale, y: (mousePoint.y - pan.y) / scale };
    
    const newScale = e.deltaY > 0 ? scale * (1 - zoomFactor) : scale * (1 + zoomFactor);
    const clampedScale = Math.max(0.2, Math.min(newScale, 3));
    
    const newX = mousePoint.x - contentPoint.x * clampedScale;
    const newY = mousePoint.y - contentPoint.y * clampedScale;

    setScale(clampedScale);
    setPan({x: newX, y: newY});
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    setIsPanning(true);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    e.preventDefault();
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
  
  // --- Touch Handlers ---
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 1) { // Pan
      lastPanPosition.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      setIsPanning(true);
    } else if (e.touches.length === 2) { // Pinch
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      );
      lastPinchDistance.current = dist;
    }
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    // Panning with one finger
    if (e.touches.length === 1 && lastPanPosition.current) {
      const touch = e.touches[0];
      const dx = touch.clientX - lastPanPosition.current.x;
      const dy = touch.clientY - lastPanPosition.current.y;
      setPan(prevPan => ({ x: prevPan.x + dx, y: prevPan.y + dy }));
      lastPanPosition.current = { x: touch.clientX, y: touch.clientY };
    }
    // Pinch-zooming with two fingers
    else if (e.touches.length === 2 && lastPinchDistance.current && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const touch1 = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        const touch2 = { x: e.touches[1].clientX, y: e.touches[1].clientY };

        const midpoint = { x: (touch1.x + touch2.x) / 2 - rect.left, y: (touch1.y + touch2.y) / 2 - rect.top };
        const contentPoint = { x: (midpoint.x - pan.x) / scale, y: (midpoint.y - pan.y) / scale };

        const newDist = Math.hypot(touch1.x - touch2.x, touch1.y - touch2.y);
        const newScale = scale * (newDist / lastPinchDistance.current);
        const clampedScale = Math.max(0.2, Math.min(newScale, 3));

        const newX = midpoint.x - contentPoint.x * clampedScale;
        const newY = midpoint.y - contentPoint.y * clampedScale;

        setScale(clampedScale);
        setPan({ x: newX, y: newY });
        lastPinchDistance.current = newDist;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    setIsPanning(false);
    lastPanPosition.current = null;
    lastPinchDistance.current = null;
  };

  const zoomIn = () => setScale(s => Math.min(s * 1.2, 3));
  const zoomOut = () => setScale(s => Math.max(s / 1.2, 0.2));
  const reset = () => {
    if (isInFocusMode && selectedPersonId) {
        panToPerson(selectedPersonId);
    } else {
        fitAndCenterTree();
    }
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
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
    >
      <div 
        ref={contentRef}
        className="inline-flex tree tree-content"
        style={{ 
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transformOrigin: '0 0',
            cursor: isPanning ? 'grabbing' : 'grab',
            transition: isPanning ? 'none' : 'transform 0.3s ease-out',
        }}
      >
        <ul className="flex justify-center items-start px-16 pb-8">
            {roots.map(root => (
                <TreeNode 
                  key={root.id} 
                  person={root} 
                  onFocusPerson={onFocusPerson}
                  onShowDetails={onShowDetails}
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