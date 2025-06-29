import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Taskbar from '@/components/system/Taskbar';
import { OsContext, type OsState, type WindowState } from '@/contexts/OsContext';
import { APPS } from '@/lib/apps';
import { ThemeProvider } from 'next-themes';

const mockDispatch = vi.fn();
const mockLaunchApp = vi.fn();
const mockSetTheme = vi.fn();

const welcomeApp = APPS.find(app => app.id === 'welcome')!;
const settingsApp = APPS.find(app => app.id === 'settings')!;

// Custom render function
const renderWithContext = (state: OsState) => {
  return render(
    <ThemeProvider>
      <OsContext.Provider value={{ state, dispatch: mockDispatch, launchApp: mockLaunchApp, theme: 'light', setTheme: mockSetTheme }}>
        <Taskbar />
      </OsContext.Provider>
    </ThemeProvider>
  );
};

describe('Taskbar Component (UI Test)', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the clock and app launcher', async () => {
    const initialState: OsState = { windows: [], activeWindowId: null, nextZIndex: 100 };
    renderWithContext(initialState);
    
    expect(screen.getByRole('button', { name: /Launch applications/i })).toBeInTheDocument();
    
    // Use findByText as the clock's time is rendered after an effect
    const timeElement = await screen.findByText(/(\d{1,2}:\d{2}\s(AM|PM))/i);
    expect(timeElement).toBeInTheDocument();
  });

  it('should render buttons for open applications', () => {
    const windows: WindowState[] = [
      { id: 'win1', appId: 'welcome', title: 'Welcome', position: {x:100,y:100}, size: welcomeApp.defaultSize, isMinimized: false, isMaximized: false, zIndex: 100 },
      { id: 'win2', appId: 'settings', title: 'Settings', position: {x:150,y:150}, size: settingsApp.defaultSize, isMinimized: false, isMaximized: false, zIndex: 101 },
    ];
    const state: OsState = { windows, activeWindowId: 'win2', nextZIndex: 102 };
    renderWithContext(state);

    expect(screen.getByRole('button', { name: /Welcome/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Settings/i })).toBeInTheDocument();
  });

  it('should highlight the active window button', () => {
    const windows: WindowState[] = [
        { id: 'win1', appId: 'welcome', title: 'Welcome', position: {x:100,y:100}, size: welcomeApp.defaultSize, isMinimized: false, isMaximized: false, zIndex: 100 },
        { id: 'win2', appId: 'settings', title: 'Settings', position: {x:150,y:150}, size: settingsApp.defaultSize, isMinimized: false, isMaximized: false, zIndex: 101 },
    ];
    const state: OsState = { windows, activeWindowId: 'win2', nextZIndex: 102 };
    renderWithContext(state);

    const welcomeButton = screen.getByRole('button', { name: /Welcome/i });
    const settingsButton = screen.getByRole('button', { name: /Settings/i });

    expect(welcomeButton).not.toHaveClass('bg-accent/50');
    expect(settingsButton).toHaveClass('bg-accent/50');
    expect(screen.getByText('Settings')).toHaveClass('font-semibold');
  });

  it('should show an indicator for minimized windows', () => {
    const windows: WindowState[] = [
        { id: 'win1', appId: 'welcome', title: 'Welcome', position: {x:100,y:100}, size: welcomeApp.defaultSize, isMinimized: true, isMaximized: false, zIndex: 100 },
    ];
    const state: OsState = { windows, activeWindowId: null, nextZIndex: 101 };
    renderWithContext(state);

    const welcomeButton = screen.getByRole('button', { name: /Welcome/i });
    // The indicator is an empty div with specific classes, so we query for it inside the button
    expect(welcomeButton.querySelector('div.w-1\\.5.h-1\\.5')).toBeInTheDocument();
  });

  it('should dispatch FOCUS_WINDOW when a taskbar button is clicked', () => {
    const windows: WindowState[] = [
        { id: 'win1', appId: 'welcome', title: 'Welcome', position: {x:100,y:100}, size: welcomeApp.defaultSize, isMinimized: false, isMaximized: false, zIndex: 100 },
    ];
    const state: OsState = { windows, activeWindowId: null, nextZIndex: 101 };
    renderWithContext(state);
    
    const welcomeButton = screen.getByRole('button', { name: /Welcome/i });
    fireEvent.click(welcomeButton);
    
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'FOCUS_WINDOW', payload: { id: 'win1' } });
  });

});
