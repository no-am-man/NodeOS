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

const resizeHandles = [
  { direction: 'top', className: 'cursor-ns-resize top-0 h-2 inset-x-4' },
  { direction: 'bottom', className: 'cursor-ns-resize bottom-0 h-2 inset-x-4' },
  { direction: 'left', className: 'cursor-ew-resize left-0 w-2 inset-y-4' },
  { direction: 'right', className: 'cursor-ew-resize right-0 w-2 inset-y-4' },
  { direction: 'top-left', className: 'cursor-nwse-resize top-0 left-0 w-4 h-4' },
  { direction: 'top-right', className: 'cursor-nesw-resize top-0 right-0 w-4 h-4' },
  { direction: 'bottom-left', className: 'cursor-nesw-resize bottom-0 left-0 w-4 h-4' },
  { direction: 'bottom-right', className: 'cursor-nwse-resize bottom-0 right-0 w-4 h-4' },
];

export default function Window({ win, children }: WindowProps) {
  const { dispatch } = useOs();
  const App = findApp(win.appId);
  const headerRef = useRef<HTMLDivElement>(null);
  
  // Drag/Resize state refs
  const isDragging = useRef(false);
  const activeResizeHandle = useRef<string | null>(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const initialWindowRect = useRef({ x: 0, y: 0, width: 0, height: 0 });

  // Live geometry state for display
  const [position, setPosition] = useState(win.position);
  const [size, setSize] = useState(win.size);
  
  // Refs to hold the latest geometry for mouseUp dispatch, avoiding stale state in closure
  const positionRef = useRef(win.position);
  const sizeRef = useRef(win.size);

  useEffect(() => {
    if (!win.isMaximized) {
        setPosition(win.position);
        setSize(win.size);
        positionRef.current = win.position;
        sizeRef.current = win.size;
    }
  }, [win.isMaximized, win.position, win.size]);


  const handleDragMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0 || win.isMaximized) return;
    dispatch({ type: 'FOCUS_WINDOW', payload: { id: win.id } });

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
    if (e.button !== 0 || win.isMaximized) return;
    dispatch({ type: 'FOCUS_WINDOW', payload: { id: win.id } });

    activeResizeHandle.current = e.currentTarget.dataset.direction || null;
    dragStartPos.current = { x: e.clientX, y: e.clientY, };
    initialWindowRect.current = { x: position.x, y: position.y, width: size.width, height: size.height };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: globalThis.MouseEvent) => {
    if (isDragging.current) {
        const newX = e.clientX - dragStartPos.current.x;
        const newY = e.clientY - dragStartPos.current.y;
        const newPos = { x: newX, y: newY };
        setPosition(newPos);
        positionRef.current = newPos;
        return;
    }
    
    if (activeResizeHandle.current) {
        const dx = e.clientX - dragStartPos.current.x;
        const dy = e.clientY - dragStartPos.current.y;

        let { x, y, width, height } = initialWindowRect.current;
        const minWidth = 200;
        const minHeight = 150;
        
        if (activeResizeHandle.current.includes('right')) {
            width += dx;
        }
        if (activeResizeHandle.current.includes('bottom')) {
            height += dy;
        }
        if (activeResizeHandle.current.includes('left')) {
            width -= dx;
            x += dx;
        }
        if (activeResizeHandle.current.includes('top')) {
            height -= dy;
            y += dy;
        }

        if (width < minWidth) {
            if (activeResizeHandle.current.includes('left')) {
                x += width - minWidth;
            }
            width = minWidth;
        }
        if (height < minHeight) {
            if (activeResizeHandle.current.includes('top')) {
                y += height - minHeight;
            }
            height = minHeight;
        }
        
        const newPos = { x, y };
        const newSize = { width, height };

        setPosition(newPos);
        setSize(newSize);
        positionRef.current = newPos;
        sizeRef.current = newSize;
    }
  };

  const handleMouseUp = () => {
    if (isDragging.current) {
        dispatch({ type: 'UPDATE_WINDOW_POSITION', payload: { id: win.id, position: positionRef.current } });
    } else if (activeResizeHandle.current) {
        dispatch({ type: 'UPDATE_WINDOW_GEOMETRY', payload: { id: win.id, position: positionRef.current, size: sizeRef.current } });
    }
    isDragging.current = false;
    activeResizeHandle.current = null;
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
        className={cn("flex items-center justify-between pl-3 pr-1 h-8 bg-secondary rounded-t-lg", {
            "cursor-grab active:cursor-grabbing": !win.isMaximized,
            "cursor-default": win.isMaximized,
        })}
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
        <>
          {resizeHandles.map(({ direction, className }) => (
            <div
              key={direction}
              data-direction={direction}
              className={cn("absolute", className)}
              onMouseDown={handleResizeMouseDown}
            />
          ))}
        </>
      )}
    </div>
  );
}
