
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useToast, toast } from '@/hooks/use-toast';

describe('useToast Hook (Utility Test)', () => {

    // Before each test, we need to reset the module-level state.
    // We can do this by calling the hook and then calling dismiss without an ID,
    // which clears all toasts and their associated removal timers.
    beforeEach(() => {
        vi.useFakeTimers();
        const { result } = renderHook(() => useToast());
        act(() => {
            result.current.dismiss();
        });
        // Ensure all removal timers from previous tests are cleared.
        vi.runAllTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should start with an empty array of toasts', () => {
        const { result } = renderHook(() => useToast());
        expect(result.current.toasts).toEqual([]);
    });

    it('should add a toast when toast() is called', () => {
        const { result } = renderHook(() => useToast());

        act(() => {
            toast({ title: 'Test Toast' });
        });

        expect(result.current.toasts.length).toBe(1);
        expect(result.current.toasts[0].title).toBe('Test Toast');
        expect(result.current.toasts[0].open).toBe(true);
    });

    it('should dismiss a specific toast when dismiss(id) is called', () => {
        const { result } = renderHook(() => useToast());
        let toastToDismiss: { id: string; [key: string]: any; };

        act(() => {
            toast({ title: 'Toast 1' });
            toastToDismiss = toast({ title: 'Toast 2' }); // This one will be at index 0
        });

        expect(result.current.toasts[0].open).toBe(true);
        expect(result.current.toasts[0].title).toBe('Toast 2');

        act(() => {
            result.current.dismiss(toastToDismiss.id);
        });

        // The toast's open state should be updated to false
        expect(result.current.toasts[0].open).toBe(false);
    });

    it('should remove a toast after the remove delay has passed', () => {
        const { result } = renderHook(() => useToast());

        act(() => {
            toast({ title: 'A toast to remove' });
        });
        
        expect(result.current.toasts.length).toBe(1);

        // Dismiss the toast to start the removal timer
        act(() => {
            result.current.dismiss(result.current.toasts[0].id);
        });
        
        expect(result.current.toasts[0].open).toBe(false);
        
        // Fast-forward time
        act(() => {
            vi.runAllTimers();
        });

        // The toast should now be gone from the array
        expect(result.current.toasts.length).toBe(0);
    });

    it('should respect the TOAST_LIMIT of 3', () => {
        const { result } = renderHook(() => useToast());

        act(() => {
            toast({ title: 'First Toast' });
            toast({ title: 'Second Toast' });
            toast({ title: 'Third Toast' });
        });

        expect(result.current.toasts.length).toBe(3);
        expect(result.current.toasts[0].title).toBe('Third Toast');
        expect(result.current.toasts[1].title).toBe('Second Toast');
        expect(result.current.toasts[2].title).toBe('First Toast');

        // This one should push out the first toast
        act(() => {
            toast({ title: 'Fourth Toast' });
        });

        expect(result.current.toasts.length).toBe(3);
        expect(result.current.toasts[0].title).toBe('Fourth Toast');
        expect(result.current.toasts[1].title).toBe('Third Toast');
        expect(result.current.toasts[2].title).toBe('Second Toast');
        // 'First Toast' should be gone.
        expect(result.current.toasts.find(t => t.title === 'First Toast')).toBeUndefined();
    });

    it('should update an existing toast when its update() method is called', () => {
        const { result } = renderHook(() => useToast());
        let testToast: { update: (props: any) => void };
        
        act(() => {
            testToast = toast({ title: 'Initial Title' });
        });

        expect(result.current.toasts[0].title).toBe('Initial Title');

        act(() => {
            testToast.update({ title: 'Updated Title' });
        });

        expect(result.current.toasts[0].title).toBe('Updated Title');
        expect(result.current.toasts.length).toBe(1); // Ensure it didn't add a new toast
    });
});
