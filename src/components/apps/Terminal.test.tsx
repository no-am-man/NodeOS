import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import Terminal from '@/components/apps/Terminal';
import { OsContext, type OsState, type WindowState } from '@/contexts/OsContext';
import { APPS } from '@/lib/apps';
import { ThemeProvider } from 'next-themes';


// Custom render function to provide the OsContext
const renderWithContext = (state: OsState = { windows: [], activeWindowId: null, nextZIndex: 100 }) => {
    return render(
      <ThemeProvider>
        <OsContext.Provider value={{ state, dispatch: vi.fn(), launchApp: vi.fn(), theme: 'light', setTheme: vi.fn() }}>
          <Terminal />
        </OsContext.Provider>
      </ThemeProvider>
    );
  };

describe('Terminal Component (UI Test)', () => {

    afterEach(() => {
        vi.restoreAllMocks();
    });
    
    it('should render the initial welcome messages and focus the input', () => {
        renderWithContext();
        expect(screen.getByText(/WebFrameOS Terminal/i)).toBeInTheDocument();
        expect(screen.getByText(/Type "help" for a list of available commands./i)).toBeInTheDocument();
        const input = screen.getByTestId('terminal-input');
        expect(input).toBeInTheDocument();
        // JSDOM doesn't fully support focus management in the same way a browser does.
        // We can check if the element is the active element in the document.
        expect(document.activeElement).toBe(input);
    });

    it('should allow user to type in the input', () => {
        renderWithContext();
        const input = screen.getByTestId('terminal-input');
        fireEvent.change(input, { target: { value: 'date' } });
        expect(input).toHaveValue('date');
    });

    it('should process the "date" command and show output', async () => {
        const mockDate = new Date('2024-01-01T12:00:00.000Z');
        vi.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

        renderWithContext();
        const input = screen.getByTestId('terminal-input');

        fireEvent.change(input, { target: { value: 'date' } });
        fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
        
        expect(await screen.findByText(mockDate.toLocaleString())).toBeInTheDocument();
        expect(input).toHaveValue('');
    });

    it('should process the "help" command', async () => {
        renderWithContext();
        const input = screen.getByTestId('terminal-input');

        fireEvent.change(input, { target: { value: 'help' } });
        fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

        expect(await screen.findByText(/Available commands:/i)).toBeInTheDocument();
        expect(await screen.findByText(/ps\s+-\s+List running processes/i)).toBeInTheDocument();
    });

    it('should process the "echo" command', async () => {
        renderWithContext();
        const input = screen.getByTestId('terminal-input');

        fireEvent.change(input, { target: { value: 'echo hello world' } });
        fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

        expect(await screen.findByText('hello world')).toBeInTheDocument();
        expect(input).toHaveValue('');
    });

    it('should process the "ps" command and list open windows', async () => {
        const welcomeApp = APPS.find(app => app.id === 'welcome')!;
        const settingsApp = APPS.find(app => app.id === 'settings')!;
        const windows: WindowState[] = [
          { id: 'win-123', appId: 'welcome', title: 'Welcome', position: { x: 1, y: 1 }, size: welcomeApp.defaultSize, isMinimized: false, isMaximized: false, zIndex: 100 },
          { id: 'win-456', appId: 'settings', title: 'System Settings', position: { x: 1, y: 1 }, size: settingsApp.defaultSize, isMinimized: false, isMaximized: false, zIndex: 101 },
        ];
        const state: OsState = { windows, activeWindowId: 'win-456', nextZIndex: 102 };
        
        renderWithContext(state);
        
        const input = screen.getByTestId('terminal-input');
        fireEvent.change(input, { target: { value: 'ps' } });
        fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

        // Use regex for more flexible matching of whitespace
        expect(await screen.findByText(/PID\s+APP\s+TITLE/i)).toBeInTheDocument();
        expect(await screen.findByText(/win-123\s+welcome\s+Welcome/i)).toBeInTheDocument();
        expect(await screen.findByText(/win-456\s+settings\s+System Settings/i)).toBeInTheDocument();
    });

    it('should handle unknown commands', async () => {
        renderWithContext();
        const input = screen.getByTestId('terminal-input');

        fireEvent.change(input, { target: { value: 'foo bar' } });
        fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

        expect(await screen.findByText(/Command not found: foo bar/i)).toBeInTheDocument();
    });

    it('should clear the screen on "clear" command', async () => {
        renderWithContext();
        const input = screen.getByTestId('terminal-input');

        // Add some history
        fireEvent.change(input, { target: { value: 'echo some history' } });
        fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
        await screen.findByText('some history');

        // Clear
        fireEvent.change(input, { target: { value: 'clear' } });
        fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
        
        // The old history should be gone
        expect(screen.queryByText('some history')).not.toBeInTheDocument();
        
        // The welcome message should be back
        expect(screen.getByText(/WebFrameOS Terminal/i)).toBeInTheDocument();
    });
});
