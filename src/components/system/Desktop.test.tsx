import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Desktop from '@/components/system/Desktop';
import { OsContext, type OsState, type WindowState } from '@/contexts/OsContext';
import { APPS } from '@/lib/apps';
import { ThemeProvider } from 'next-themes';

const mockDispatch = vi.fn();
const welcomeApp = APPS.find(app => app.id === 'welcome')!;
const settingsApp = APPS.find(app => app.id === 'settings')!;

// Custom render function
const renderWithContext = (state: OsState) => {
  return render(
    <ThemeProvider>
      <OsContext.Provider value={{ state, dispatch: mockDispatch, launchApp: vi.fn(), theme: 'light', setTheme: vi.fn() }}>
        <Desktop />
      </OsContext.Provider>
    </ThemeProvider>
  );
};

describe('Desktop Component (UI Test)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the desktop background image', () => {
    const initialState: OsState = { windows: [], activeWindowId: null, nextZIndex: 100 };
    renderWithContext(initialState);
    expect(screen.getByAltText('Desktop background')).toBeInTheDocument();
  });

  it('should render open, non-minimized windows', () => {
    const windows: WindowState[] = [
      { id: 'win1', appId: 'welcome', title: 'Welcome', position: { x: 100, y: 100 }, size: welcomeApp.defaultSize, isMinimized: false, isMaximized: false, zIndex: 100 },
    ];
    const state: OsState = { windows, activeWindowId: 'win1', nextZIndex: 101 };
    renderWithContext(state);
    expect(screen.getByText('Welcome')).toBeInTheDocument();
  });

  it('should not render minimized windows', () => {
    const windows: WindowState[] = [
      { id: 'win1', appId: 'welcome', title: 'Welcome', position: { x: 100, y: 100 }, size: welcomeApp.defaultSize, isMinimized: false, isMaximized: false, zIndex: 100 },
      { id: 'win2', appId: 'settings', title: 'Settings', position: { x: 150, y: 150 }, size: settingsApp.defaultSize, isMinimized: true, isMaximized: false, zIndex: 101 },
    ];
    const state: OsState = { windows, activeWindowId: 'win1', nextZIndex: 102 };
    renderWithContext(state);

    expect(screen.getByText('Welcome')).toBeInTheDocument();
    expect(screen.queryByText('Settings')).not.toBeInTheDocument();
  });

  it('should dispatch FOCUS_WINDOW with an empty ID when clicking the desktop background', () => {
    const initialState: OsState = { windows: [], activeWindowId: null, nextZIndex: 100 };
    renderWithContext(initialState);
    
    const desktopElement = screen.getByAltText('Desktop background').parentElement;
    expect(desktopElement).toBeInTheDocument();
    
    if (desktopElement) {
        fireEvent.mouseDown(desktopElement);
    }
    
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'FOCUS_WINDOW', payload: { id: '' } });
  });
});
