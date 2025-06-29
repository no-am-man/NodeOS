import { describe, it, expect } from 'vitest';
import { APPS, findApp } from '@/lib/apps';

describe('App Registry (Utility Test)', () => {
  it('should have a valid structure for all apps', () => {
    expect(APPS.length).toBeGreaterThan(0);
    for (const app of APPS) {
      expect(app).toHaveProperty('id');
      expect(typeof app.id).toBe('string');
      
      expect(app).toHaveProperty('name');
      expect(typeof app.name).toBe('string');
      
      expect(app).toHaveProperty('Icon');
      expect(typeof app.Icon).toBe('function');

      expect(app).toHaveProperty('Component');
      // The component can be a standard function/class component or a Next.js dynamic component object
      expect(['function', 'object']).toContain(typeof app.Component);

      expect(app).toHaveProperty('defaultSize');
      expect(typeof app.defaultSize.width).toBe('number');
      expect(typeof app.defaultSize.height).toBe('number');
    }
  });

  it('findApp should return the correct app for a valid ID', () => {
    const welcomeApp = findApp('welcome');
    expect(welcomeApp).toBeDefined();
    expect(welcomeApp?.id).toBe('welcome');
    expect(welcomeApp?.name).toBe('Welcome');

    const whiteboardApp = findApp('whiteboard');
    expect(whiteboardApp).toBeDefined();
    expect(whiteboardApp?.id).toBe('whiteboard');
    expect(whiteboardApp?.name).toBe('Whiteboard');

    const codeEditorApp = findApp('code-editor');
    expect(codeEditorApp).toBeDefined();
    expect(codeEditorApp?.id).toBe('code-editor');
    expect(codeEditorApp?.name).toBe('Code Editor');
  });

  it('findApp should return undefined for an invalid ID', () => {
    const nonExistentApp = findApp('non-existent-app');
    expect(nonExistentApp).toBeUndefined();
  });
});
