import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import Terminal from '@/components/apps/Terminal';

describe('Terminal Component (UI Test)', () => {

    afterEach(() => {
        vi.restoreAllMocks();
    });
    
    it('should render the initial welcome messages and focus the input', () => {
        render(<Terminal />);
        expect(screen.getByText(/WebFrameOS Terminal/i)).toBeInTheDocument();
        expect(screen.getByText(/Type "help" for a list of available commands./i)).toBeInTheDocument();
        const input = screen.getByTestId('terminal-input');
        expect(input).toBeInTheDocument();
        expect(input).toHaveFocus();
    });

    it('should allow user to type in the input', () => {
        render(<Terminal />);
        const input = screen.getByTestId('terminal-input');
        fireEvent.change(input, { target: { value: 'date' } });
        expect(input).toHaveValue('date');
    });

    it('should process the "date" command and show output', async () => {
        const mockDate = new Date('2024-01-01T12:00:00.000Z');
        vi.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

        render(<Terminal />);
        const input = screen.getByTestId('terminal-input');

        fireEvent.change(input, { target: { value: 'date' } });
        fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
        
        expect(await screen.findByText(mockDate.toLocaleString())).toBeInTheDocument();
        expect(input).toHaveValue('');
    });

    it('should process the "help" command', async () => {
        render(<Terminal />);
        const input = screen.getByTestId('terminal-input');

        fireEvent.change(input, { target: { value: 'help' } });
        fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

        expect(await screen.findByText(/Available commands:/i)).toBeInTheDocument();
    });

    it('should process the "echo" command', async () => {
        render(<Terminal />);
        const input = screen.getByTestId('terminal-input');

        fireEvent.change(input, { target: { value: 'echo hello world' } });
        fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

        expect(await screen.findByText('hello world')).toBeInTheDocument();
        expect(input).toHaveValue('');
    });

    it('should handle unknown commands', async () => {
        render(<Terminal />);
        const input = screen.getByTestId('terminal-input');

        fireEvent.change(input, { target: { value: 'foo bar' } });
        fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

        expect(await screen.findByText(/Command not found: foo bar/i)).toBeInTheDocument();
    });

    it('should clear the screen on "clear" command', async () => {
        render(<Terminal />);
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