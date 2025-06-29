import { describe, it, expect, vi, beforeEach } from 'vitest';

// This is the mock function that will replace the real prompt
const mockPromptFn = vi.fn();

// Mock the genkit module BEFORE importing the flow
vi.mock('@/ai/genkit', async () => {
  const actual = await vi.importActual<any>('@/ai/genkit');
  return {
    ...actual,
    ai: {
      ...actual.ai,
      definePrompt: vi.fn(() => mockPromptFn), // When definePrompt is called, it returns our mock function
      defineFlow: vi.fn((config, implementation) => implementation), // defineFlow just passes the implementation through
    },
  };
});

// Now we can import the flow. It will be initialized with our mocks.
import { aiAssistantPromptResponse } from '@/ai/flows/ai-assistant-prompt-response';


describe('AI Assistant Flow (Server Test)', () => {

  beforeEach(() => {
    // Clear mock history before each test
    mockPromptFn.mockClear();
  });

  it('should call the AI prompt with the correct input and return its output', async () => {
    const userInput = { prompt: 'Hello there!' };
    const mockAiOutput = { response: 'General Kenobi!' };

    // Set up the mock return value for this specific test
    mockPromptFn.mockResolvedValue({ output: mockAiOutput });

    const result = await aiAssistantPromptResponse(userInput);

    expect(mockPromptFn).toHaveBeenCalledOnce();
    expect(mockPromptFn).toHaveBeenCalledWith(userInput);
    expect(result).toEqual(mockAiOutput);
  });

  it('should propagate errors from the AI prompt', async () => {
    const userInput = { prompt: 'This will cause an error' };
    const testError = new Error('AI Model Error');
    
    // Set up the mock to reject for this specific test
    mockPromptFn.mockRejectedValue(testError);

    await expect(aiAssistantPromptResponse(userInput)).rejects.toThrow('AI Model Error');
    expect(mockPromptFn).toHaveBeenCalledOnce();
    expect(mockPromptFn).toHaveBeenCalledWith(userInput);
  });
});
