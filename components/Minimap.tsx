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
  className?: string;
}

export const Minimap: React.FC<MinimapProps> = ({ containerSize, contentSize, pan, scale, roots, onPan, className }) => {
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
    if (!minimapSize.width || !contentSize.width || minimapSize.width <= 0 || minimapSize.height <= 0) return 0;
    // The content will scale to fit within the full dimensions of the container.
    const availableWidth = minimapSize.width;
    const availableHeight = minimapSize.height;
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

  const handleInteraction = useCallback((e: React.MouseEvent<HTMLDivElement> | MouseEvent) => {
    if (!minimapRef.current) return;
    const rect = minimapRef.current.getBoundingClientRect();
    
    // Calculate the click position relative to the minimap's scaled content area
    const offsetX = (minimapSize.width - minimapContentSize.width) / 2;
    const offsetY = (minimapSize.height - minimapContentSize.height) / 2;

    const clickX = e.clientX - rect.left - offsetX;
    const clickY = e.clientY - rect.top - offsetY;
    
    // Normalize the position to a 0-1 range based on the content size, clamping at the edges
    const normalizedX = Math.max(0, Math.min(1, clickX / minimapContentSize.width));
    const normalizedY = Math.max(0, Math.min(1, clickY / minimapContentSize.height));
    
    onPan({ x: normalizedX, y: normalizedY });
  }, [minimapSize, minimapContentSize, onPan]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!minimapRef.current) return;

    const rect = minimapRef.current.getBoundingClientRect();
    
    // Calculate click position relative to the minimap's content area
    const offsetX = (minimapSize.width - minimapContentSize.width) / 2;
    const offsetY = (minimapSize.height - minimapContentSize.height) / 2;
    const clickX = e.clientX - rect.left - offsetX;
    const clickY = e.clientY - rect.top - offsetY;

    // Only start interaction if the click is within the content bounds
    if (clickX < 0 || clickX > minimapContentSize.width || clickY < 0 || clickY > minimapContentSize.height) {
        return;
    }

    handleInteraction(e); // Pan on initial click
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
        handleInteraction(moveEvent);
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
      className={`flex-shrink-0 w-48 h-10 rounded-full overflow-hidden flex items-center justify-center border border-slate-300 dark:border-slate-600 px-2 ${className || ''}`}
      title="Minimap Navigator"
      onMouseDown={handleMouseDown}
    >
        <div 
          className="relative"
          style={{
            width: `${minimapContentSize.width}px`,
            height: `${minimapContentSize.height}px`,
            cursor: 'pointer',
          }}
        >
          <div 
              style={{ 
                  transform: `scale(${minimapScale})`,
                  transformOrigin: 'top left',
              }}
          >
              <div className="inline-flex tree minimap-tree">
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