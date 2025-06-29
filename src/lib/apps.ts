import { type ComponentType } from 'react';
import { Bot, Calculator, Settings, Smile, Terminal } from 'lucide-react';

import dynamic from 'next/dynamic';

const AIAssistant = dynamic(() => import('@/components/apps/AIAssistant'));
const SettingsApp = dynamic(() => import('@/components/apps/Settings'));
const Welcome = dynamic(() => import('@/components/apps/Welcome'));
const CalculatorApp = dynamic(() => import('@/components/apps/Calculator'));
const TerminalApp = dynamic(() => import('@/components/apps/Terminal'));

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
];

export const findApp = (id: string) => APPS.find(app => app.id === id);
