import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Window from '@/components/system/Window';
import { OsContext, type WindowState } from '@/contexts/OsContext';
import { APPS } from '@/lib/apps';

const mockDispatch = vi.fn();
const welcomeApp = APPS.find(app => app.id === 'welcome')!;

const getInitialWindowState = (): WindowState => ({
  id: 'win-test-1',
  appId: welcomeApp.id,
  title: 'Test Window',
  position: { x: 100, y: 100 },
  size: { width: 500, height: 400 },
  isMinimized: false,
  isMaximized: false,
  zIndex: 101,
});

// A custom render function to provide the OsContext
const renderWindow = (win: WindowState) => {
  return render(
    <OsContext.Provider value={{ state: {} as any, dispatch: mockDispatch, launchApp: vi.fn(), theme: 'light', setTheme: vi.fn() }}>
      <Window win={win}>
        <div>Window Content</div>
      </Window>
    </OsContext.Provider>
  );
};

describe('Window Component (UI Test)', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the window with title and content', () => {
    const windowState = getInitialWindowState();
    renderWindow(windowState);

    expect(screen.getByText('Test Window')).toBeInTheDocument();
    expect(screen.getByText('Window Content')).toBeInTheDocument();
    expect(screen.getByLabelText('Minimize window')).toBeInTheDocument();
    expect(screen.getByLabelText('Maximize window')).toBeInTheDocument();
    expect(screen.getByLabelText('Close window')).toBeInTheDocument();
  });

  it('should call dispatch with CLOSE_WINDOW when close button is clicked', () => {
    const windowState = getInitialWindowState();
    renderWindow(windowState);

    const closeButton = screen.getByLabelText('Close window');
    fireEvent.click(closeButton);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'CLOSE_WINDOW',
      payload: { id: windowState.id },
    });
  });

  it('should call dispatch with MINIMIZE_WINDOW when minimize button is clicked', () => {
    const windowState = getInitialWindowState();
    renderWindow(windowState);
    
    const minimizeButton = screen.getByLabelText('Minimize window');
    fireEvent.click(minimizeButton);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'MINIMIZE_WINDOW',
      payload: { id: windowState.id },
    });
  });

  it('should call dispatch with TOGGLE_MAXIMIZE_WINDOW when maximize button is clicked', () => {
    const windowState = getInitialWindowState();
    renderWindow(windowState);

    const maximizeButton = screen.getByLabelText('Maximize window');
    fireEvent.click(maximizeButton);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'TOGGLE_MAXIMIZE_WINDOW',
      payload: { id: windowState.id },
    });
  });
  
  it('should call dispatch with FOCUS_WINDOW when window is clicked', () => {
    const windowState = getInitialWindowState();
    renderWindow(windowState);
    
    const windowDiv = screen.getByText('Test Window').closest('div[class*="absolute"]');
    expect(windowDiv).toBeInTheDocument();

    if (windowDiv) {
        fireEvent.mouseDown(windowDiv);
    }

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'FOCUS_WINDOW',
      payload: { id: windowState.id },
    });
  });
});
