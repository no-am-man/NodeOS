"use client";

import { useRef, useState, type MouseEvent, type ReactNode, useEffect } from 'react';
import { useOs, type WindowState } from '@/contexts/OsContext';
import { Button } from '@/components/ui/button';
import { Minus, Square, X as CloseIcon } from 'lucide-react';
import { findApp } from '@/lib/apps';
import { cn } from '@/lib/utils';

interface WindowProps {
  win: WindowState;
  children: ReactNode;
}

export default function Window({ win, children }: WindowProps) {
  const { dispatch } = useOs();
  const App = findApp(win.appId);
  const headerRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const isResizing = useRef(false);
  const dragStartPos = useRef({ x: 0, y: 0 });

  const [position, setPosition] = useState(win.position);
  const [size, setSize] = useState(win.size);

  useEffect(() => {
    if (!win.isMaximized) {
        setPosition(win.position);
        setSize(win.size)
    }
  }, [win.isMaximized, win.position, win.size]);


  const handleDragMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    dispatch({ type: 'FOCUS_WINDOW', payload: { id: win.id } });
    if(win.isMaximized) return;

    isDragging.current = true;
    dragStartPos.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };
  
  const handleResizeMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (e.button !== 0) return;
    dispatch({ type: 'FOCUS_WINDOW', payload: { id: win.id } });
    if(win.isMaximized) return;

    isResizing.current = true;
    dragStartPos.current = {
        x: e.clientX,
        y: e.clientY,
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: globalThis.MouseEvent) => {
    if (isDragging.current) {
        const newX = e.clientX - dragStartPos.current.x;
        const newY = e.clientY - dragStartPos.current.y;
        setPosition({ x: newX, y: newY });
    }
    if (isResizing.current) {
        const newWidth = size.width + (e.clientX - dragStartPos.current.x);
        const newHeight = size.height + (e.clientY - dragStartPos.current.y);
        dragStartPos.current = { x: e.clientX, y: e.clientY };
        setSize({ width: Math.max(200, newWidth), height: Math.max(150, newHeight) });
    }
  };

  const handleMouseUp = () => {
    if (isDragging.current) {
        dispatch({ type: 'UPDATE_WINDOW_POSITION', payload: { id: win.id, position } });
    }
    if (isResizing.current) {
        dispatch({ type: 'UPDATE_WINDOW_SIZE', payload: { id: win.id, size } });
    }
    isDragging.current = false;
    isResizing.current = false;
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  };

  const handleFocus = () => {
    dispatch({ type: 'FOCUS_WINDOW', payload: { id: win.id } });
  }

  const handleClose = () => dispatch({ type: 'CLOSE_WINDOW', payload: { id: win.id } });
  const handleMinimize = () => dispatch({ type: 'MINIMIZE_WINDOW', payload: { id: win.id } });
  const handleMaximize = () => dispatch({ type: 'TOGGLE_MAXIMIZE_WINDOW', payload: { id: win.id } });

  const windowStyle = win.isMaximized
    ? { top: 0, left: 0, width: '100%', height: 'calc(100% - 2.5rem)', zIndex: win.zIndex }
    : { top: position.y, left: position.x, width: size.width, height: size.height, zIndex: win.zIndex };

  return (
    <div
      className={cn(
        'absolute rounded-lg shadow-2xl bg-card text-card-foreground flex flex-col border border-primary/20 transition-all duration-100 ease-in-out',
        { 'opacity-0 scale-90 pointer-events-none': win.isMinimized }
      )}
      style={windowStyle}
      onMouseDown={handleFocus}
    >
      <header
        ref={headerRef}
        className="flex items-center justify-between pl-3 pr-1 h-8 bg-secondary rounded-t-lg cursor-grab active:cursor-grabbing"
        onMouseDown={handleDragMouseDown}
        onDoubleClick={handleMaximize}
      >
        <div className="flex items-center gap-2">
            {App && <App.Icon className="w-4 h-4 text-muted-foreground" />}
            <span className="text-sm font-medium select-none">{win.title}</span>
        </div>
        <div className="flex items-center">
          <Button variant="ghost" size="icon" className="w-7 h-7" onClick={handleMinimize} aria-label="Minimize window"><Minus size={14} /></Button>
          <Button variant="ghost" size="icon" className="w-7 h-7" onClick={handleMaximize} aria-label="Maximize window"><Square size={14} /></Button>
          <Button variant="ghost" size="icon" className="w-7 h-7 hover:bg-destructive" onClick={handleClose} aria-label="Close window"><CloseIcon size={16} /></Button>
        </div>
      </header>
      <main className="flex-grow p-2 overflow-auto bg-card rounded-b-lg">
        {children}
      </main>
      {!win.isMaximized && (
        <div
            ref={resizeRef}
            className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize"
            onMouseDown={handleResizeMouseDown}
        />
      )}
    </div>
  );
}
