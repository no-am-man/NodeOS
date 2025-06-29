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

  it('should update position on drag', () => {
    const windowState = getInitialWindowState();
    renderWindow(windowState);
    
    const header = screen.getByText('Test Window').parentElement!;
    
    // Start drag
    fireEvent.mouseDown(header, { clientX: 110, clientY: 110 });
    
    // Drag
    fireEvent.mouseMove(window, { clientX: 160, clientY: 180 });

    // End drag
    fireEvent.mouseUp(window);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'UPDATE_WINDOW_POSITION',
      payload: { id: windowState.id, position: { x: 150, y: 170 } },
    });
  });

  it('should update size on resize', () => {
    const windowState = getInitialWindowState();
    const { container } = renderWindow(windowState);
    
    const resizeHandle = container.querySelector('.cursor-nwse-resize');
    expect(resizeHandle).toBeInTheDocument();
    
    if (!resizeHandle) return;

    // Start resize
    fireEvent.mouseDown(resizeHandle, { clientX: 600, clientY: 500 }); // initial size is 500x400, pos 100,100, so bottom right is at 600,500
    
    // Resize
    fireEvent.mouseMove(window, { clientX: 650, clientY: 520 });

    // End resize
    fireEvent.mouseUp(window);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'UPDATE_WINDOW_SIZE',
      payload: { id: windowState.id, size: { width: 550, height: 420 } },
    });
  });
});
