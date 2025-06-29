import { describe, it, expect } from 'vitest';
import { osReducer, initialState, type Action, type WindowState } from './OsContext';
import { APPS } from '@/lib/apps';

describe('OS Reducer (State Logic Test)', () => {
    const welcomeApp = APPS.find(app => app.id === 'welcome')!;
    const settingsApp = APPS.find(app => app.id === 'settings')!;

    it('should return the initial state for an unknown action', () => {
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

    it('should handle LAUNCH_APP for an existing, minimized application', () => {
        let state = osReducer(initialState, { type: 'LAUNCH_APP', payload: welcomeApp });
        const windowId = state.windows[0].id;
        state = osReducer(state, { type: 'MINIMIZE_WINDOW', payload: { id: windowId } });

        // Relaunch the same app
        const relaunchAction: Action = { type: 'LAUNCH_APP', payload: welcomeApp };
        const relaunchedState = osReducer(state, relaunchAction);
        const relaunchedWindow = relaunchedState.windows.find(w => w.id === windowId);

        expect(relaunchedState.windows.length).toBe(1);
        expect(relaunchedWindow?.isMinimized).toBe(false);
        expect(relaunchedWindow?.zIndex).toBe(state.nextZIndex);
        expect(relaunchedState.activeWindowId).toBe(windowId);
    });

    it('should handle CLOSE_WINDOW', () => {
        const launchAction: Action = { type: 'LAUNCH_APP', payload: welcomeApp };
        const launchedState = osReducer(initialState, launchAction);
        const windowIdToClose = launchedState.windows[0].id;

        const closeAction: Action = { type: 'CLOSE_WINDOW', payload: { id: windowIdToClose } };
        const finalState = osReducer(launchedState, closeAction);

        expect(finalState.windows.length).toBe(0);
        expect(finalState.activeWindowId).toBe(null);
    });

    it('should handle FOCUS_WINDOW', () => {
        let state = osReducer(initialState, { type: 'LAUNCH_APP', payload: welcomeApp }); // zIndex: 100
        state = osReducer(state, { type: 'LAUNCH_APP', payload: settingsApp }); // zIndex: 101, active

        const firstWindowId = state.windows[0].id; // Welcome app window

        const focusAction: Action = { type: 'FOCUS_WINDOW', payload: { id: firstWindowId } };
        const focusedState = osReducer(state, focusAction);
        
        const focusedWindow = focusedState.windows.find(win => win.id === firstWindowId);

        expect(focusedState.activeWindowId).toBe(firstWindowId);
        expect(focusedWindow?.zIndex).toBe(state.nextZIndex); // The new highest z-index
        expect(focusedState.nextZIndex).toBe(state.nextZIndex + 1);
    });

    it('should handle FOCUS_WINDOW with an empty ID to blur windows', () => {
        let state = osReducer(initialState, { type: 'LAUNCH_APP', payload: welcomeApp }); // active window exists
        
        const focusDesktopAction: Action = { type: 'FOCUS_WINDOW', payload: { id: '' } };
        const finalState = osReducer(state, focusDesktopAction);
    
        expect(finalState.activeWindowId).toBe(null);
        // Ensure windows and zIndex are not changed
        expect(finalState.windows).toEqual(state.windows);
        expect(finalState.nextZIndex).toEqual(state.nextZIndex);
    });

    it('should not change z-index if focused window is already active and on top', () => {
        let state = osReducer(initialState, { type: 'LAUNCH_APP', payload: welcomeApp });
        const activeWindowId = state.activeWindowId;
        const initialZIndex = state.windows[0].zIndex;
        const initialNextZIndex = state.nextZIndex;
    
        const focusAction: Action = { type: 'FOCUS_WINDOW', payload: { id: activeWindowId! } };
        const focusedState = osReducer(state, focusAction);
    
        expect(focusedState.activeWindowId).toBe(activeWindowId);
        expect(focusedState.windows[0].zIndex).toBe(initialZIndex);
        expect(focusedState.nextZIndex).toBe(initialNextZIndex);
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

    it('should handle TOGGLE_MAXIMIZE_WINDOW', () => {
        let state = osReducer(initialState, { type: 'LAUNCH_APP', payload: welcomeApp });
        const windowId = state.windows[0].id;

        const maximizeAction: Action = { type: 'TOGGLE_MAXIMIZE_WINDOW', payload: { id: windowId } };
        let maximizedState = osReducer(state, maximizeAction);
        let maximizedWindow = maximizedState.windows.find(win => win.id === windowId);
        
        expect(maximizedWindow?.isMaximized).toBe(true);

        const unmaximizeAction: Action = { type: 'TOGGLE_MAXIMIZE_WINDOW', payload: { id: windowId } };
        let unmaximizedState = osReducer(maximizedState, unmaximizeAction);
        let unmaximizedWindow = unmaximizedState.windows.find(win => win.id === windowId);

        expect(unmaximizedWindow?.isMaximized).toBe(false);
    });

    it('should handle UPDATE_WINDOW_POSITION', () => {
        let state = osReducer(initialState, { type: 'LAUNCH_APP', payload: welcomeApp });
        const windowId = state.windows[0].id;
        const newPosition = { x: 500, y: 500 };

        const updateAction: Action = { type: 'UPDATE_WINDOW_POSITION', payload: { id: windowId, position: newPosition } };
        const updatedState = osReducer(state, updateAction);
        const updatedWindow = updatedState.windows.find(win => win.id === windowId);

        expect(updatedWindow?.position).toEqual(newPosition);
    });
    
    it('should handle UPDATE_WINDOW_GEOMETRY', () => {
        let state = osReducer(initialState, { type: 'LAUNCH_APP', payload: welcomeApp });
        const windowId = state.windows[0].id;
        const newPosition = { x: 50, y: 50 };
        const newSize = { width: 100, height: 100 };

        const updateAction: Action = { type: 'UPDATE_WINDOW_GEOMETRY', payload: { id: windowId, position: newPosition, size: newSize } };
        const updatedState = osReducer(state, updateAction);
        const updatedWindow = updatedState.windows.find(win => win.id === windowId);

        expect(updatedWindow?.position).toEqual(newPosition);
        expect(updatedWindow?.size).toEqual(newSize);
    });
    
    it('should handle HYDRATE_WINDOWS', () => {
        const windowsToHydrate: WindowState[] = [
            { id: 'win1', appId: 'welcome', title: 'Welcome', position: { x: 1, y: 1 }, size: { width: 1, height: 1 }, isMinimized: false, isMaximized: false, zIndex: 150 },
            { id: 'win2', appId: 'settings', title: 'Settings', position: { x: 2, y: 2 }, size: { width: 2, height: 2 }, isMinimized: true, isMaximized: false, zIndex: 151 },
        ];
        
        const hydrateAction: Action = { type: 'HYDRATE_WINDOWS', payload: { windows: windowsToHydrate } };
        const hydratedState = osReducer(initialState, hydrateAction);

        expect(hydratedState.windows).toEqual(windowsToHydrate);
        expect(hydratedState.nextZIndex).toBe(152);
        expect(hydratedState.activeWindowId).toBe(null);
    });

    it('should handle SET_DESKTOP_BACKGROUND', () => {
        const newUrl = 'http://example.com/new-bg.png';
        const action: Action = { type: 'SET_DESKTOP_BACKGROUND', payload: { url: newUrl } };
        const state = osReducer(initialState, action);

        expect(state.desktopBackgroundUrl).toBe(newUrl);
    });
});
