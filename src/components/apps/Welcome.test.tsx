import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Welcome from '@/components/apps/Welcome';

describe('Welcome Component (UI Test)', () => {
  it('renders the welcome message', () => {
    render(<Welcome />);
    
    expect(screen.getByRole('heading', { name: /Welcome to WebFrameOS/i })).toBeInTheDocument();
    
    expect(screen.getByText(/This is a simulated operating system running entirely in your browser./i)).toBeInTheDocument();
    expect(screen.getByText(/Launch applications from the menu, move windows, and explore what's possible./i)).toBeInTheDocument();
  });
});
