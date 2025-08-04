import React, { useState, useRef, useCallback } from 'react';

interface SplitPaneProps {
  children: [React.ReactNode, React.ReactNode, React.ReactNode];
  leftWidth?: number;
  middleWidth?: number;
  className?: string;
}

export function SplitPane({ 
  children, 
  leftWidth = 25, 
  middleWidth = 50, 
  className = "" 
}: SplitPaneProps) {
  const [leftPaneWidth, setLeftPaneWidth] = useState(leftWidth);
  const [middlePaneWidth, setMiddlePaneWidth] = useState(middleWidth);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<'left' | 'right' | null>(null);

  const handleMouseDown = useCallback((divider: 'left' | 'right') => {
    setIsDragging(divider);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const percentage = ((e.clientX - rect.left) / rect.width) * 100;

    if (isDragging === 'left') {
      const newLeftWidth = Math.max(15, Math.min(40, percentage));
      setLeftPaneWidth(newLeftWidth);
    } else if (isDragging === 'right') {
      const newMiddleWidth = Math.max(30, Math.min(70, percentage - leftPaneWidth));
      setMiddlePaneWidth(newMiddleWidth);
    }
  }, [isDragging, leftPaneWidth]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(null);
  }, []);

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const rightPaneWidth = 100 - leftPaneWidth - middlePaneWidth;

  return (
    <div 
      ref={containerRef}
      className={`flex h-full select-none ${className}`}
      style={{ userSelect: isDragging ? 'none' : 'auto' }}
    >
      {/* Left Pane - Data Panel */}
      <div 
        className="bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 overflow-hidden"
        style={{ width: `${leftPaneWidth}%` }}
        aria-label="Data Panel"
        role="region"
      >
        {children[0]}
      </div>

      {/* Left Resizer */}
      <div
        className="resizer w-1 bg-black opacity-20 hover:opacity-40 cursor-col-resize transition-opacity duration-200 relative group"
        onMouseDown={() => handleMouseDown('left')}
        aria-label="Resize data panel"
        role="separator"
        tabIndex={0}
      >
        <div className="absolute inset-0 w-3 -translate-x-1 group-hover:bg-blue-500 group-hover:opacity-30" />
      </div>

      {/* Middle Pane - Chat Panel */}
      <div 
        className="bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-hidden"
        style={{ width: `${middlePaneWidth}%` }}
        aria-label="Chat Panel"
        role="region"
      >
        {children[1]}
      </div>

      {/* Right Resizer */}
      <div
        className="resizer w-1 bg-black opacity-20 hover:opacity-40 cursor-col-resize transition-opacity duration-200 relative group"
        onMouseDown={() => handleMouseDown('right')}
        aria-label="Resize chat panel"
        role="separator"
        tabIndex={0}
      >
        <div className="absolute inset-0 w-3 -translate-x-1 group-hover:bg-blue-500 group-hover:opacity-30" />
      </div>

      {/* Right Pane - Results Panel */}
      <div 
        className="bg-gray-50 dark:bg-gray-900 overflow-hidden"
        style={{ width: `${rightPaneWidth}%` }}
        aria-label="Results Panel"
        role="region"
      >
        {children[2]}
      </div>
    </div>
  );
}