import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ThemeProvider } from 'next-themes';
import Settings from '@/components/apps/Settings';

// The Settings component uses the useTheme hook from next-themes.
// For testing, we must wrap it in a ThemeProvider.
const TestSettings = () => (
  <ThemeProvider attribute="class" defaultTheme="light">
    <Settings />
  </ThemeProvider>
);

describe('Settings Component (UI Test)', () => {
  it('should render the settings panel with appearance options', () => {
    render(<TestSettings />);
    
    expect(screen.getByRole('heading', { name: /Appearance/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Light/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Dark/i)).toBeInTheDocument();
  });

  it('should reflect the default theme on initial render', () => {
    render(<TestSettings />);
    
    // The default theme in our test wrapper is 'light'
    const lightRadio = screen.getByRole('radio', { name: /Light/i });
    expect(lightRadio).toBeChecked();
  });

  it('should allow the user to change the theme selection', () => {
    render(<TestSettings />);
    
    const darkRadio = screen.getByRole('radio', { name: /Dark/i });
    const lightRadio = screen.getByRole('radio', { name: /Light/i });

    // Initially, light theme should be selected
    expect(lightRadio).toBeChecked();
    expect(darkRadio).not.toBeChecked();

    // User clicks the 'Dark' theme option
    fireEvent.click(darkRadio);

    // Now, dark theme should be selected
    expect(darkRadio).toBeChecked();
    expect(lightRadio).not.toBeChecked();
  });
});
