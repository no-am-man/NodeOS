"use client";

import { createContext, useContext, useReducer, type Dispatch, type ReactNode, useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { ref, set, get } from 'firebase/database';

import { APPS, type App } from '@/lib/apps';
import { database } from '@/lib/firebase';
import { generateBackground } from '@/ai/flows/generate-background-flow';


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

export interface OsState {
  windows: WindowState[];
  activeWindowId: string | null;
  nextZIndex: number;
  desktopBackgroundUrl: string;
}

export type Action =
  | { type: 'LAUNCH_APP'; payload: App }
  | { type: 'CLOSE_WINDOW'; payload: { id: string } }
  | { type: 'FOCUS_WINDOW'; payload: { id: string } }
  | { type: 'MINIMIZE_WINDOW'; payload: { id: string } }
  | { type: 'TOGGLE_MAXIMIZE_WINDOW'; payload: { id: string } }
  | { type: 'UPDATE_WINDOW_POSITION'; payload: { id: string; position: { x: number; y: number } } }
  | { type: 'UPDATE_WINDOW_GEOMETRY'; payload: { id: string; position: { x: number; y: number }, size: { width: number; height: number } } }
  | { type: 'HYDRATE_WINDOWS'; payload: { windows: WindowState[] } }
  | { type: 'SET_DESKTOP_BACKGROUND'; payload: { url: string } };

export const initialState: OsState = {
  windows: [],
  activeWindowId: null,
  nextZIndex: 100,
  desktopBackgroundUrl: 'https://placehold.co/1920x1080.png',
};

export const osReducer = (state: OsState, action: Action): OsState => {
  switch (action.type) {
    case 'HYDRATE_WINDOWS': {
      const { windows } = action.payload;
      if (!windows || windows.length === 0) {
        return state;
      }
      const maxZIndex = Math.max(...windows.map(w => w.zIndex), 99);
      return {
        ...state,
        windows,
        nextZIndex: maxZIndex + 1,
        activeWindowId: null,
      };
    }
    case 'SET_DESKTOP_BACKGROUND':
        return {
            ...state,
            desktopBackgroundUrl: action.payload.url,
        };
    case 'LAUNCH_APP': {
      const existingWindow = state.windows.find(win => win.appId === action.payload.id);
      
      // If window exists, bring it to front and un-minimize it.
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
    case 'CLOSE_WINDOW': {
      const newWindows = state.windows.filter(win => win.id !== action.payload.id);
      return {
        ...state,
        windows: newWindows,
        activeWindowId: state.activeWindowId === action.payload.id ? null : state.activeWindowId,
      };
    }
    case 'FOCUS_WINDOW': {
        if (!action.payload.id) {
            return { ...state, activeWindowId: null };
        }

        const windowToFocus = state.windows.find(win => win.id === action.payload.id);
        if (!windowToFocus) return state;

        // If it's already the active window and has the highest z-index, do nothing.
        const maxZIndex = Math.max(0, ...state.windows.map(w => w.zIndex));
        if (state.activeWindowId === action.payload.id && windowToFocus.zIndex === maxZIndex) {
            return state;
        }

        return {
            ...state,
            windows: state.windows.map(win =>
              win.id === action.payload.id ? { ...win, zIndex: state.nextZIndex, isMinimized: false } : win
            ),
            activeWindowId: action.payload.id,
            nextZIndex: state.nextZIndex + 1,
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
    case 'UPDATE_WINDOW_GEOMETRY':
        return {
            ...state,
            windows: state.windows.map(win =>
                win.id === action.payload.id 
                ? { ...win, position: action.payload.position, size: action.payload.size } 
                : win
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
  generateAndSetBackground: () => Promise<void>;
  theme: string | undefined;
  setTheme: (theme: string) => void;
}

export const OsContext = createContext<OsContextType | undefined>(undefined);

export const OsProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(osReducer, initialState);
  const { theme, setTheme } = useTheme();
  const dataLoaded = useRef(false);

  // Load from DB on mount
  useEffect(() => {
    const dbRef = ref(database);
    get(dbRef).then((snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        if (data.windows && Array.isArray(data.windows) && data.windows.length > 0) {
          dispatch({ type: 'HYDRATE_WINDOWS', payload: { windows: data.windows } });
        } else {
           // Data is empty/invalid, launch default
           APPS.filter(app => app.isDefault).forEach(app => {
                dispatch({ type: 'LAUNCH_APP', payload: app });
            });
        }
        if (data.desktopBackgroundUrl) {
            dispatch({ type: 'SET_DESKTOP_BACKGROUND', payload: { url: data.desktopBackgroundUrl } });
        }
      } else {
        // No data, launch default
        APPS.filter(app => app.isDefault).forEach(app => {
            dispatch({ type: 'LAUNCH_APP', payload: app });
        });
      }
    }).finally(() => {
      dataLoaded.current = true;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save to DB on change
  useEffect(() => {
    if (!dataLoaded.current) {
      return;
    }
    const stateToSave = {
        windows: state.windows.length > 0 ? state.windows : null,
        desktopBackgroundUrl: state.desktopBackgroundUrl,
    }
    const dbRef = ref(database);
    set(dbRef, stateToSave);
  }, [state.windows, state.desktopBackgroundUrl]);


  const launchApp = (app: App) => {
    dispatch({ type: 'LAUNCH_APP', payload: app });
  };

  const generateAndSetBackground = async () => {
    const result = await generateBackground();
    if (result.imageDataUri) {
        dispatch({ type: 'SET_DESKTOP_BACKGROUND', payload: { url: result.imageDataUri } });
    }
  };

  return (
    <OsContext.Provider value={{ state, dispatch, launchApp, theme, setTheme, generateAndSetBackground }}>
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
