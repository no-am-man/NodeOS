import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useIsMobile } from '@/hooks/use-mobile';

// We need to manage the window.matchMedia mock more dynamically for this test
const matchMediaMock = vi.fn();

describe('useIsMobile Hook (Utility Test)', () => {

  beforeEach(() => {
    // Set up a fresh mock for each test
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: matchMediaMock,
    });
    // Set a default innerWidth for each test
    Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024, // Default to desktop
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return false for desktop resolutions', () => {
    matchMediaMock.mockImplementation(query => ({
        matches: false, // For max-width: 767px, this will be false on desktop
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

    const { result } = renderHook(() => useIsMobile());
    
    expect(result.current).toBe(false);
  });

  it('should return true for mobile resolutions', () => {
    // Simulate a mobile screen size
    Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
    });
    matchMediaMock.mockImplementation(query => ({
        matches: true, // For max-width: 767px, this will be true on mobile
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(true);
  });

  it('should update when screen size changes', () => {
    let changeCallback: () => void = () => {};

    matchMediaMock.mockImplementation(query => ({
        matches: false, // Start as desktop
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: (event: string, callback: () => void) => {
            if (event === 'change') {
                changeCallback = callback;
            }
        },
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

    const { result } = renderHook(() => useIsMobile());
    
    // Initial check
    expect(result.current).toBe(false);

    // Simulate window resize to mobile
    act(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 400,
      });
      // Trigger the 'change' event listener that the hook sets up
      if (changeCallback) {
        changeCallback(); 
      }
    });

    // Check if the hook updated
    expect(result.current).toBe(true);
  });
});
