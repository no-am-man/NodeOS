import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AIAssistant from '@/components/apps/AIAssistant';
import { aiAssistantPromptResponse } from '@/ai/flows/ai-assistant-prompt-response';

// Mock the AI flow
vi.mock('@/ai/flows/ai-assistant-prompt-response');

describe('AIAssistant Component (UI Test)', () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render initial message from AI', () => {
    render(<AIAssistant />);
    expect(screen.getByText("Hello! How can I assist you today?")).toBeInTheDocument();
  });

  it('should allow user to send a message and receive a response', async () => {
    const mockResponse = { response: 'This is a test response.' };
    (aiAssistantPromptResponse as vi.Mock).mockResolvedValue(mockResponse);

    render(<AIAssistant />);

    const input = screen.getByPlaceholderText('Type your message...');
    const sendButton = screen.getByText('Send');

    // User types and sends a message
    fireEvent.change(input, { target: { value: 'Hello AI!' } });
    fireEvent.click(sendButton);
    
    // Check that the input was sent and the UI updated
    expect(await screen.findByText('Hello AI!')).toBeInTheDocument();
    expect(input).toHaveValue('');
    expect(sendButton).toBeDisabled();
    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
    
    // Wait for the AI response to appear
    const aiResponse = await screen.findByText('This is a test response.');
    expect(aiResponse).toBeInTheDocument();

    // Check that loading indicator is gone and button is enabled
    expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
    expect(sendButton).not.toBeDisabled();
  });

  it('should display an error message if the AI call fails', async () => {
    (aiAssistantPromptResponse as vi.Mock).mockRejectedValue(new Error('AI call failed'));
    
    render(<AIAssistant />);

    const input = screen.getByPlaceholderText('Type your message...');
    const sendButton = screen.getByText('Send');

    fireEvent.change(input, { target: { value: 'Trigger error' } });
    fireEvent.click(sendButton);

    // Check that the loading indicator is visible
    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();

    // Wait for the error message to appear
    const errorMessage = await screen.findByText("Sorry, I encountered an error. Please try again.");
    expect(errorMessage).toBeInTheDocument();
    
    // Check that loading indicator is gone and button is enabled
    expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
    expect(sendButton).not.toBeDisabled();
  });
});
