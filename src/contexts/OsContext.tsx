"use client";

import { createContext, useContext, useReducer, type Dispatch, type ReactNode, useEffect } from 'react';
import { APPS, type App } from '@/lib/apps';
import { useTheme } from 'next-themes';

export interface WindowState {
  id: string;
  appId: string;
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
}

interface OsState {
  windows: WindowState[];
  activeWindowId: string | null;
  nextZIndex: number;
}

type Action =
  | { type: 'LAUNCH_APP'; payload: App }
  | { type: 'CLOSE_WINDOW'; payload: { id: string } }
  | { type: 'FOCUS_WINDOW'; payload: { id: string } }
  | { type: 'MINIMIZE_WINDOW'; payload: { id: string } }
  | { type: 'TOGGLE_MAXIMIZE_WINDOW'; payload: { id: string } }
  | { type: 'UPDATE_WINDOW_POSITION'; payload: { id: string; position: { x: number; y: number } } }
  | { type: 'UPDATE_WINDOW_SIZE'; payload: { id: string; size: { width: number; height: number } } };

const initialState: OsState = {
  windows: [],
  activeWindowId: null,
  nextZIndex: 100,
};

const osReducer = (state: OsState, action: Action): OsState => {
  switch (action.type) {
    case 'LAUNCH_APP': {
      const existingWindow = state.windows.find(win => win.appId === action.payload.id && !win.isMinimized);
      if (existingWindow) {
        return {
            ...state,
            windows: state.windows.map(win =>
              win.id === existingWindow.id ? { ...win, zIndex: state.nextZIndex, isMinimized: false } : win
            ),
            activeWindowId: existingWindow.id,
            nextZIndex: state.nextZIndex + 1,
          };
      }

      const newWindow: WindowState = {
        id: `${action.payload.id}-${Date.now()}`,
        appId: action.payload.id,
        title: action.payload.name,
        position: { x: Math.random() * 200 + 50, y: Math.random() * 150 + 50 },
        size: action.payload.defaultSize,
        isMinimized: false,
        isMaximized: false,
        zIndex: state.nextZIndex,
      };
      return {
        ...state,
        windows: [...state.windows, newWindow],
        activeWindowId: newWindow.id,
        nextZIndex: state.nextZIndex + 1,
      };
    }
    case 'CLOSE_WINDOW':
      return {
        ...state,
        windows: state.windows.filter(win => win.id !== action.payload.id),
      };
    case 'FOCUS_WINDOW': {
        const isMinimized = state.windows.find(win => win.id === action.payload.id)?.isMinimized;
        return {
            ...state,
            windows: state.windows.map(win =>
            win.id === action.payload.id ? { ...win, zIndex: state.nextZIndex, isMinimized: false } : win
            ),
            activeWindowId: isMinimized ? state.activeWindowId : action.payload.id,
            nextZIndex: isMinimized ? state.nextZIndex : state.nextZIndex + 1,
        };
    }
    case 'MINIMIZE_WINDOW':
      return {
        ...state,
        windows: state.windows.map(win =>
          win.id === action.payload.id ? { ...win, isMinimized: true } : win
        ),
        activeWindowId: state.activeWindowId === action.payload.id ? null : state.activeWindowId,
      };
    case 'TOGGLE_MAXIMIZE_WINDOW':
      return {
        ...state,
        windows: state.windows.map(win =>
          win.id === action.payload.id ? { ...win, isMaximized: !win.isMaximized, isMinimized: false } : win
        ),
        activeWindowId: action.payload.id,
        nextZIndex: state.nextZIndex + 1,
      };
    case 'UPDATE_WINDOW_POSITION':
      return {
        ...state,
        windows: state.windows.map(win =>
          win.id === action.payload.id ? { ...win, position: action.payload.position } : win
        ),
      };
    case 'UPDATE_WINDOW_SIZE':
        return {
            ...state,
            windows: state.windows.map(win =>
              win.id === action.payload.id ? { ...win, size: action.payload.size } : win
            ),
          };
    default:
      return state;
  }
};

interface OsContextType {
  state: OsState;
  dispatch: Dispatch<Action>;
  launchApp: (app: App) => void;
  theme: string | undefined;
  setTheme: (theme: string) => void;
}

const OsContext = createContext<OsContextType | undefined>(undefined);

export const OsProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(osReducer, initialState);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    APPS.filter(app => app.isDefault).forEach(app => {
        dispatch({ type: 'LAUNCH_APP', payload: app });
    });
  }, []);

  const launchApp = (app: App) => {
    dispatch({ type: 'LAUNCH_APP', payload: app });
  };

  return (
    <OsContext.Provider value={{ state, dispatch, launchApp, theme, setTheme }}>
      {children}
    </OsContext.Provider>
  );
};

export const useOs = (): OsContextType => {
  const context = useContext(OsContext);
  if (!context) {
    throw new Error('useOs must be used within an OsProvider');
  }
  return context;
};
