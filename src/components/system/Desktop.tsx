"use client";

import { useOs } from '@/contexts/OsContext';
import Window from './Window';
import { findApp } from '@/lib/apps';
import Image from 'next/image';

export default function Desktop() {
  const { state, dispatch } = useOs();

  return (
    <div className="flex-grow w-full h-full relative" onMouseDown={() => dispatch({type: 'FOCUS_WINDOW', payload: {id: ''}})}>
      <Image 
        src="https://placehold.co/1920x1080.png" 
        alt="Desktop background"
        layout="fill"
        objectFit="cover"
        className="z-0"
        data-ai-hint="abstract background"
      />
      {state.windows.map((win) => {
        const app = findApp(win.appId);
        if (!app || win.isMinimized) return null;

        return (
          <Window key={win.id} win={win}>
            <app.Component />
          </Window>
        );
      })}
    </div>
  );
}
