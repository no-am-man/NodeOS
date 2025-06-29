import { describe, it, expect } from 'vitest';
import { osReducer, initialState, type Action } from './OsContext';
import { APPS } from '@/lib/apps';

describe('OS Reducer (State Logic Test)', () => {
    const welcomeApp = APPS.find(app => app.id === 'welcome')!;

    it('should return the initial state for an unknown action', () => {
        // This is a type assertion to allow for an action not defined in the Action type
        const unknownAction = { type: 'UNKNOWN_ACTION' } as unknown as Action;
        expect(osReducer(initialState, unknownAction)).toEqual(initialState);
    });

    it('should handle LAUNCH_APP for a new application', () => {
        const action: Action = { type: 'LAUNCH_APP', payload: welcomeApp };
        const state = osReducer(initialState, action);

        expect(state.windows.length).toBe(1);
        expect(state.windows[0].appId).toBe('welcome');
        expect(state.windows[0].title).toBe('Welcome');
        expect(state.windows[0].zIndex).toBe(100);
        expect(state.activeWindowId).toBe(state.windows[0].id);
        expect(state.nextZIndex).toBe(101);
    });

    it('should handle CLOSE_WINDOW', () => {
        // First, launch an app
        const launchAction: Action = { type: 'LAUNCH_APP', payload: welcomeApp };
        const launchedState = osReducer(initialState, launchAction);
        const windowIdToClose = launchedState.windows[0].id;

        // Then, close it
        const closeAction: Action = { type: 'CLOSE_WINDOW', payload: { id: windowIdToClose } };
        const finalState = osReducer(launchedState, closeAction);

        expect(finalState.windows.length).toBe(0);
    });

    it('should handle FOCUS_WINDOW', () => {
        // Launch two apps
        const settingsApp = APPS.find(app => app.id === 'settings')!;
        let state = osReducer(initialState, { type: 'LAUNCH_APP', payload: welcomeApp }); // zIndex: 100
        state = osReducer(state, { type: 'LAUNCH_APP', payload: settingsApp }); // zIndex: 101, active

        const firstWindowId = state.windows[0].id; // Welcome app window

        // Focus the first window
        const focusAction: Action = { type: 'FOCUS_WINDOW', payload: { id: firstWindowId } };
        const focusedState = osReducer(state, focusAction);
        
        const focusedWindow = focusedState.windows.find(win => win.id === firstWindowId);

        expect(focusedState.activeWindowId).toBe(firstWindowId);
        expect(focusedWindow?.zIndex).toBe(state.nextZIndex); // The new highest z-index
        expect(focusedState.nextZIndex).toBe(state.nextZIndex + 1);
    });

    it('should handle MINIMIZE_WINDOW', () => {
        let state = osReducer(initialState, { type: 'LAUNCH_APP', payload: welcomeApp });
        const windowToMinimizeId = state.windows[0].id;
        
        const minimizeAction: Action = { type: 'MINIMIZE_WINDOW', payload: { id: windowToMinimizeId } };
        const minimizedState = osReducer(state, minimizeAction);

        const minimizedWindow = minimizedState.windows.find(win => win.id === windowToMinimizeId);
        expect(minimizedWindow?.isMinimized).toBe(true);
        expect(minimizedState.activeWindowId).toBe(null);
    });
});
