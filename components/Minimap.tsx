import React, { useRef, useMemo, useLayoutEffect, useState, useCallback } from 'react';
import { Person } from '../types';
import { MinimapNode } from './MinimapNode';

interface MinimapProps {
  containerSize: { width: number; height: number };
  contentSize: { width: number; height: number };
  pan: { x: number; y: number };
  scale: number;
  roots: Person[];
  onPan: (position: { x: number; y: number }) => void;
}

export const Minimap: React.FC<MinimapProps> = ({ containerSize, contentSize, pan, scale, roots, onPan }) => {
  const minimapRef = useRef<HTMLDivElement>(null);
  const [minimapSize, setMinimapSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    if (!minimapRef.current) return;
    const observer = new ResizeObserver(entries => {
      const entry = entries[0];
      if (entry) {
        setMinimapSize({ width: entry.contentRect.width, height: entry.contentRect.height });
      }
    });
    observer.observe(minimapRef.current);
    return () => observer.disconnect();
  }, []);

  const minimapScale = useMemo(() => {
    if (!minimapSize.width || !contentSize.width) return 0;
    const padding = 16; // p-2 is 0.5rem * 2 = 16px
    const availableWidth = minimapSize.width - padding;
    const availableHeight = minimapSize.height - padding;
    return Math.min(availableWidth / contentSize.width, availableHeight / contentSize.height);
  }, [minimapSize, contentSize]);

  const minimapContentSize = {
    width: contentSize.width * minimapScale,
    height: contentSize.height * minimapScale,
  };

  const viewportStyle = {
    width: `${containerSize.width / scale * minimapScale}px`,
    height: `${containerSize.height / scale * minimapScale}px`,
    transform: `translate(${-pan.x / scale * minimapScale}px, ${-pan.y / scale * minimapScale}px)`,
  };

  const handleInteraction = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!minimapRef.current) return;
    const rect = minimapRef.current.getBoundingClientRect();
    
    // Calculate the click position relative to the minimap's scaled content area
    const offsetX = (minimapSize.width - minimapContentSize.width) / 2;
    const offsetY = (minimapSize.height - minimapContentSize.height) / 2;

    const clickX = e.clientX - rect.left - offsetX;
    const clickY = e.clientY - rect.top - offsetY;
    
    // Normalize the position to a 0-1 range based on the content size
    const normalizedX = Math.max(0, Math.min(1, clickX / minimapContentSize.width));
    const normalizedY = Math.max(0, Math.min(1, clickY / minimapContentSize.height));
    
    onPan({ x: normalizedX, y: normalizedY });
  }, [minimapSize, minimapContentSize, onPan]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleInteraction(e); // Pan on initial click
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
        // Create a synthetic event to pass to the handler
        const syntheticEvent = { clientX: moveEvent.clientX, clientY: moveEvent.clientY, preventDefault: () => {} } as any;
        handleInteraction(syntheticEvent);
    };

    const handleMouseUp = () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };
  
  return (
    <div
      ref={minimapRef}
      className="absolute bottom-4 left-4 z-20 w-48 h-48 sm:w-64 sm:h-64 bg-slate-200/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-lg border border-slate-300 dark:border-slate-700 shadow-lg overflow-hidden flex items-center justify-center p-2 cursor-pointer"
      onMouseDown={handleMouseDown}
    >
      <div 
        className="relative"
        style={{
          width: `${minimapContentSize.width}px`,
          height: `${minimapContentSize.height}px`,
        }}
      >
        <div 
            style={{ 
                transform: `scale(${minimapScale})`,
                transformOrigin: 'top left',
            }}
        >
            <div className="inline-flex tree">
                <ul className="flex justify-center items-start px-16 pb-8">
                    {roots.map(root => (
                        <MinimapNode key={root.id} person={root} />
                    ))}
                </ul>
            </div>
        </div>

        {/* Viewport indicator */}
        <div
          className="absolute top-0 left-0 bg-indigo-500/40 border-2 border-indigo-600 rounded pointer-events-none"
          style={viewportStyle}
        />
      </div>
    </div>
  );
};