import React, { useState, useRef, useLayoutEffect, useCallback, useImperativeHandle, useEffect } from 'react';
import { Person } from '../types';
import { TreeNode } from './TreeNode';

export interface MinimapViewport {
  containerSize: { width: number; height: number };
  contentSize: { width: number; height: number };
  pan: { x: number; y: number };
  scale: number;
}

export interface FamilyTreeHandle {
  panToPerson: (personId: string) => void;
  panToTop: () => void;
  handleMinimapPan: (normalizedPosition: { x: number; y: number }) => void;
}

interface FamilyTreeProps {
  roots: Person[];
  onFocusPerson: (person: Person) => void;
  onShowDetails: (person: Person) => void;
  selectedPersonId?: string;
  focusedPersonId: string | null;
  highlightedIds: Set<string>;
  isInFocusMode: boolean;
  peopleMap: Map<string, Person>;
  isSidebarVisible: boolean;
  onViewportUpdate: (viewport: MinimapViewport) => void;
}

export const FamilyTree = React.forwardRef<FamilyTreeHandle, FamilyTreeProps>(({ roots, onFocusPerson, onShowDetails, selectedPersonId, focusedPersonId, highlightedIds, isInFocusMode, peopleMap, isSidebarVisible, onViewportUpdate }, ref) => {
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const [contentSize, setContentSize] = useState({ width: 0, height: 0 });
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  
  // Refs for touch interactions
  const lastPanPosition = useRef<{ x: number, y: number } | null>(null);
  const lastPinchDistance = useRef<number | null>(null);
  
  // Refs for custom tap detection
  const tapTimeoutRef = useRef<number | null>(null);
  const lastTapInfoRef = useRef<{ personId: string; time: number } | null>(null);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const hasMovedRef = useRef(false);

  // Keep track of component dimensions for the minimap
  useLayoutEffect(() => {
    const observer = new ResizeObserver(() => {
        if (containerRef.current) {
            setContainerSize({
                width: containerRef.current.offsetWidth,
                height: containerRef.current.offsetHeight,
            });
        }
        // Use a small delay for scrollWidth to be accurate after render
        setTimeout(() => {
          if (contentRef.current) {
              setContentSize({
                  width: contentRef.current.scrollWidth,
                  height: contentRef.current.scrollHeight,
              });
          }
        }, 100);
    });

    if (containerRef.current) observer.observe(containerRef.current);
    if (contentRef.current) observer.observe(contentRef.current);

    return () => observer.disconnect();
  }, [roots]); // Re-observe if roots change, as content will re-render


  const panToTop = useCallback(() => {
    if (!containerRef.current || !contentRef.current) return;
    
    const isMobile = window.innerWidth < 768;
    const sidebarWidth = isSidebarVisible && !isMobile ? 384 : 0;

    const containerWidth = containerRef.current.offsetWidth - sidebarWidth;
    const contentWidth = contentRef.current.scrollWidth;

    if (contentWidth === 0) {
      requestAnimationFrame(panToTop);
      return;
    }

    const newScale = 1.0;
    const newX = (containerWidth - contentWidth * newScale) / 2;
    const newY = 80; // Apply top padding

    if (isNaN(newScale) || isNaN(newX) || isNaN(newY)) {
        return;
    }

    setScale(newScale);
    setPan({ x: newX, y: newY });
  }, [isSidebarVisible]);

  const panToPerson = useCallback((personId: string) => {
    if (!containerRef.current || !contentRef.current) return;
    
    const personNode = contentRef.current.querySelector(`[data-id='${personId}']`) as HTMLElement;
    if (!personNode) {
      console.warn(`panToPerson: Could not find node with id ${personId}. It might not be rendered yet.`);
      return;
    }

    const container = containerRef.current;
    
    const isMobile = window.innerWidth < 768;
    const sidebarWidth = isSidebarVisible && !isMobile ? 384 : 0;
    const availableWidth = container.offsetWidth - sidebarWidth;
    const availableHeight = container.offsetHeight;

    const newScale = 1.0;
    
    // Center horizontally
    const newX = (availableWidth / 2) - (personNode.offsetLeft + personNode.offsetWidth / 2) * newScale;
    
    // Center vertically
    const newY = (availableHeight / 2) - (personNode.offsetTop + personNode.offsetHeight / 2) * newScale;

    setScale(newScale);
    setPan({ x: newX, y: newY });
  }, [isSidebarVisible]);
  
  // Effect to pan the view when the focused person changes, now inside FamilyTree
  useLayoutEffect(() => {
    if (focusedPersonId) {
      // Use requestAnimationFrame to wait for the next repaint, ensuring the DOM is updated.
      const animationFrameId = requestAnimationFrame(() => {
        panToPerson(focusedPersonId);
      });
      return () => cancelAnimationFrame(animationFrameId);
    }
  }, [focusedPersonId, roots, panToPerson]); // Depends on focus ID, the tree structure, and the pan function itself.

  const handleMinimapPan = useCallback((normalizedPosition: { x: number, y: number }) => {
    if (!containerRef.current || !contentRef.current) return;

    const container = containerRef.current;
    const content = contentRef.current;
    
    const scaledContentWidth = content.scrollWidth * scale;
    const scaledContentHeight = content.scrollHeight * scale;
    
    const containerWidth = container.offsetWidth;
    const containerHeight = container.offsetHeight;

    // Calculate the total scrollable range (the difference between content and container sizes).
    // This is 0 if content is smaller than the container.
    const scrollableWidth = Math.max(0, scaledContentWidth - containerWidth);
    const scrollableHeight = Math.max(0, scaledContentHeight - containerHeight);

    // The new pan position is the negative of the scroll position.
    // A pan value of 0 aligns the top/left edges. A negative pan value moves the content up/left.
    const newX = -normalizedPosition.x * scrollableWidth;
    const newY = -normalizedPosition.y * scrollableHeight;

    setPan({ x: newX, y: newY });
  }, [scale]);

  useImperativeHandle(ref, () => ({
    panToPerson,
    panToTop,
    handleMinimapPan,
  }), [panToPerson, panToTop, handleMinimapPan]);
  
  useEffect(() => {
    onViewportUpdate({
        containerSize,
        contentSize,
        pan,
        scale,
    });
  }, [containerSize, contentSize, pan, scale, onViewportUpdate]);


  // Initial positioning when roots are ready or focus is cleared
  useLayoutEffect(() => {
    if (roots.length > 0 && !isInFocusMode) {
      // Delay to ensure DOM is ready for measurement
      const timeoutId = setTimeout(() => panToTop(), 100);
      return () => clearTimeout(timeoutId);
    }
  }, [roots, isInFocusMode, panToTop]);

  // Resize handling
  useEffect(() => {
    const handleResize = () => {
      if (!isInFocusMode) {
        panToTop();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isInFocusMode, panToTop]);

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
    // A touch interaction is starting, so disable CSS transitions for smoothness.
    setIsPanning(true);
    
    if (e.touches.length === 1) { // Pan or Tap
      const touch = e.touches[0];
      lastPanPosition.current = { x: touch.clientX, y: touch.clientY };
      touchStartPosRef.current = { x: touch.clientX, y: touch.clientY }; // For move detection
      hasMovedRef.current = false;
    } else if (e.touches.length === 2) { // Pinch
      e.preventDefault(); // Prevent browser default actions for pinch like page zoom
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      );
      lastPinchDistance.current = dist;
      lastPanPosition.current = null; // We are pinching, not panning
      hasMovedRef.current = true; // A pinch is a move, cancel tap.
      if (tapTimeoutRef.current) {
          clearTimeout(tapTimeoutRef.current);
          tapTimeoutRef.current = null;
      }
    }
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    // Prevent default browser actions like scrolling/zooming when we are handling the gesture.
    e.preventDefault();

    // If we move significantly, it's a drag/pinch, not a tap.
    if (!hasMovedRef.current && touchStartPosRef.current && e.touches.length === 1) {
        const touch = e.touches[0];
        const dx = touch.clientX - touchStartPosRef.current.x;
        const dy = touch.clientY - touchStartPosRef.current.y;
        if (Math.hypot(dx, dy) > 10) { // Threshold
            hasMovedRef.current = true;
            if (tapTimeoutRef.current) { // Cancel any pending single tap
                clearTimeout(tapTimeoutRef.current);
                tapTimeoutRef.current = null;
                lastTapInfoRef.current = null;
            }
        }
    }
    
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
    // Check for tap/double-tap only if we haven't moved
    if (!hasMovedRef.current) {
      const targetElement = e.target as HTMLElement;
      const personNode = targetElement.closest<HTMLElement>('[data-id]');
      
      if (personNode?.dataset.id) {
        e.preventDefault(); // Prevent ghost clicks only if a valid target was tapped
        const personId = personNode.dataset.id;
        const person = peopleMap.get(personId);
        
        if (person) {
            const now = Date.now();
            const DOUBLE_TAP_DELAY = 300;
            
            if (lastTapInfoRef.current?.personId === personId && (now - lastTapInfoRef.current.time) < DOUBLE_TAP_DELAY) {
                // Double tap
                if(tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
                onShowDetails(person);
                lastTapInfoRef.current = null;
                tapTimeoutRef.current = null;
            } else {
                // Single tap
                lastTapInfoRef.current = { personId, time: now };
                tapTimeoutRef.current = window.setTimeout(() => {
                    onFocusPerson(person);
                    lastTapInfoRef.current = null;
                }, DOUBLE_TAP_DELAY);
            }
        }
      }
    }
    
    // If one finger is lifted from a pinch, transition to panning with the remaining finger
    if (e.touches.length === 1) {
        lastPinchDistance.current = null;
        lastPanPosition.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    
    // If last finger is lifted, end the interaction state
    if (e.touches.length === 0) {
        setIsPanning(false);
        lastPanPosition.current = null;
        lastPinchDistance.current = null;
    }
  };


  const zoomIn = () => setScale(s => Math.min(s * 1.2, 3));
  const zoomOut = () => setScale(s => Math.max(s / 1.2, 0.2));
  const reset = () => {
    if (isInFocusMode && selectedPersonId) {
        panToPerson(selectedPersonId);
    } else {
        panToTop();
    }
  };

  return (
    <div 
        ref={containerRef}
        className="w-full h-full bg-slate-100 dark:bg-slate-900/50 overflow-hidden relative select-none"
        style={{ touchAction: 'none' }}
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
            <button onClick={zoomIn} title="Zoom In" className="w-10 h-10 bg-white dark:bg-slate-700 rounded-full shadow-md text-xl font-bold flex items-center justify-center">+</button>
            <button onClick={zoomOut} title="Zoom Out" className="w-10 h-10 bg-white dark:bg-slate-700 rounded-full shadow-md text-xl font-bold flex items-center justify-center">-</button>
            <button onClick={reset} title="Reset View" className="w-10 h-10 bg-white dark:bg-slate-700 rounded-full shadow-md text-sm flex items-center justify-center">Reset</button>
      </div>
    </div>
  );
});