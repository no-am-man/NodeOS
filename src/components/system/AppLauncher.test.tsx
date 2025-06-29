import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AppLauncher from '@/components/system/AppLauncher';
import { OsContext, type OsState, type Action } from '@/contexts/OsContext';
import { APPS } from '@/lib/apps';
import { ThemeProvider } from 'next-themes';

const mockLaunchApp = vi.fn();

// A custom render function to provide the OsContext
const renderWithContext = (ui: React.ReactElement) => {
  const state: OsState = {
    windows: [],
    activeWindowId: null,
    nextZIndex: 100,
  };
  const dispatch = vi.fn();

  return render(
    <ThemeProvider>
      <OsContext.Provider value={{ state, dispatch, launchApp: mockLaunchApp, theme: 'light', setTheme: vi.fn() }}>
        {ui}
      </OsContext.Provider>
    </ThemeProvider>
  );
};

describe('AppLauncher Component (UI Test)', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the launcher button', () => {
    renderWithContext(<AppLauncher />);
    expect(screen.getByRole('button', { name: /Launch applications/i })).toBeInTheDocument();
  });

  it('should open the app list popover when launcher button is clicked', async () => {
    renderWithContext(<AppLauncher />);

    // Initially, the app list should not be visible
    expect(screen.queryByText('Applications')).not.toBeInTheDocument();
    
    // Click the launcher button
    const launcherButton = screen.getByRole('button', { name: /Launch applications/i });
    fireEvent.click(launcherButton);

    // Now, the app list should be visible
    expect(await screen.findByText('Applications')).toBeInTheDocument();
    APPS.forEach(app => {
        expect(screen.getByRole('button', { name: new RegExp(app.name, 'i') })).toBeInTheDocument();
    });
  });

  it('should call launchApp with the correct app when an app button is clicked', async () => {
    renderWithContext(<AppLauncher />);
    
    // Open the popover
    const launcherButton = screen.getByRole('button', { name: /Launch applications/i });
    fireEvent.click(launcherButton);

    // Find and click the 'Settings' app button
    const settingsApp = APPS.find(app => app.id === 'settings')!;
    const settingsButton = await screen.findByRole('button', { name: /Settings/i });
    fireEvent.click(settingsButton);

    // Verify that launchApp was called with the settings app object
    expect(mockLaunchApp).toHaveBeenCalledTimes(1);
    expect(mockLaunchApp).toHaveBeenCalledWith(settingsApp);
  });
});
