"use client";

import * as React from 'react';
import { useOs } from '@/contexts/OsContext';
import AppLauncher from './AppLauncher';
import { findApp } from '@/lib/apps';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';

function Clock() {
    const [time, setTime] = React.useState<Date | null>(null);

    React.useEffect(() => {
        setTime(new Date());
        const timerId = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timerId);
    }, []);

    if (!time) {
        return null; // Render nothing on the server and initial client render to prevent hydration mismatch
    }

    return (
        <div className="text-sm px-3 text-right">
            <div>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            <div className="text-xs">{time.toLocaleDateString()}</div>
        </div>
    )
}

export default function Taskbar() {
  const { state, dispatch } = useOs();
  const { theme, setTheme } = useTheme();

  return (
    <div className="h-10 bg-secondary/80 backdrop-blur-md border-t border-primary/10 w-full flex items-center justify-between px-2 z-[99999] shadow-inner">
      <div className="flex items-center gap-2">
        <AppLauncher />
        <div className="h-6 w-px bg-border"></div>
        <div className="flex items-center gap-1">
            {state.windows.map(win => {
                const app = findApp(win.appId);
                if (!app) return null;
                const isActive = win.id === state.activeWindowId && !win.isMinimized;
                return (
                    <Button 
                        key={win.id} 
                        variant="ghost" 
                        className={cn(
                            "h-8 px-2 flex items-center gap-2",
                            isActive ? "bg-accent/50" : ""
                        )}
                        onClick={() => dispatch({type: 'FOCUS_WINDOW', payload: {id: win.id}})}
                    >
                        <app.Icon className="w-5 h-5" />
                        <span className={cn("text-sm", { "font-semibold": isActive })}>{app.name}</span>
                        {win.isMinimized && <div className="w-1.5 h-1.5 rounded-full bg-primary/50" />}
                    </Button>
                );
            })}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Clock />
      </div>
    </div>
  );
}
