import React, { type ComponentType } from 'react';
import { Bot, Brush, Calculator, Clapperboard, Code, Music, Puzzle, Settings, Smile, Terminal, Users } from 'lucide-react';

import dynamic from 'next/dynamic';

const AIAssistant = dynamic(() => import('@/components/apps/AIAssistant'));
const SettingsApp = dynamic(() => import('@/components/apps/Settings'));
const Welcome = dynamic(() => import('@/components/apps/Welcome'));
const CalculatorApp = dynamic(() => import('@/components/apps/Calculator'));
const TerminalApp = dynamic(() => import('@/components/apps/Terminal'));
const ContactBookApp = dynamic(() => import('@/components/apps/ContactBook'));

// Factory function to create a web app component
const createWebApp = (url: string, sandboxOptions: string = "allow-scripts allow-same-origin allow-forms allow-popups"): ComponentType => {
    const WebAppComponent = () => {
        return React.createElement('iframe', {
            src: url,
            sandbox: sandboxOptions,
            className: "w-full h-full border-0 bg-white",
            title: "Web App"
        });
    };
    WebAppComponent.displayName = `WebApp(${url})`;
    return WebAppComponent;
};

export interface App {
  id: string;
  name: string;
  Icon: ComponentType<{ className?: string }>;
  Component: ComponentType;
  defaultSize: { width: number; height: number };
  isDefault?: boolean;
}

export const APPS: App[] = [
  {
    id: 'welcome',
    name: 'Welcome',
    Icon: Smile,
    Component: Welcome,
    defaultSize: { width: 450, height: 300 },
    isDefault: true,
  },
  {
    id: 'contacts',
    name: 'Contacts',
    Icon: Users,
    Component: ContactBookApp,
    defaultSize: { width: 800, height: 600 },
  },
  {
    id: 'ai-assistant',
    name: 'AI Assistant',
    Icon: Bot,
    Component: AIAssistant,
    defaultSize: { width: 400, height: 550 },
  },
  {
    id: 'settings',
    name: 'Settings',
    Icon: Settings,
    Component: SettingsApp,
    defaultSize: { width: 400, height: 450 },
  },
  {
    id: 'calculator',
    name: 'Calculator',
    Icon: Calculator,
    Component: CalculatorApp,
    defaultSize: { width: 300, height: 450 },
  },
  {
    id: 'terminal',
    name: 'Terminal',
    Icon: Terminal,
    Component: TerminalApp,
    defaultSize: { width: 640, height: 380 },
  },
  {
    id: 'code-editor',
    name: 'Code Editor',
    Icon: Code,
    Component: createWebApp('https://stackblitz.com/edit/node?embed=1&file=index.js'),
    defaultSize: { width: 1024, height: 768 },
  },
  {
    id: 'whiteboard',
    name: 'Whiteboard',
    Icon: Brush,
    Component: createWebApp('https://www.tldraw.com/'),
    defaultSize: { width: 1024, height: 768 },
  },
  {
    id: 'game-2048',
    name: '2048',
    Icon: Puzzle,
    Component: createWebApp('https://www.2048.org/'),
    defaultSize: { width: 400, height: 450 },
  },
  {
    id: 'photo-editor',
    name: 'Photo Editor',
    Icon: Clapperboard,
    Component: createWebApp('https://www.photopea.com/'),
    defaultSize: { width: 1024, height: 768 },
  },
  {
    id: 'song-maker',
    name: 'Song Maker',
    Icon: Music,
    Component: createWebApp('https://musiclab.chromeexperiments.com/Song-Maker/'),
    defaultSize: { width: 800, height: 600 },
  },
];

export const findApp = (id: string) => APPS.find(app => app.id === id);
