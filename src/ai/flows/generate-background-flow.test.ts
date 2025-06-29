import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGenerate = vi.fn();

vi.mock('@/ai/genkit', async () => {
  const actual = await vi.importActual<any>('@/ai/genkit');
  return {
    ...actual,
    ai: {
      ...actual.ai,
      generate: mockGenerate,
      defineFlow: vi.fn((config, implementation) => implementation),
    },
  };
});

import { generateBackground } from '@/ai/flows/generate-background-flow';

describe('Generate Background Flow', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should call the AI generate function and return the image data URI', async () => {
        const mockImageDataUri = 'data:image/png;base64,mock-image-data';
        mockGenerate.mockResolvedValue({
            media: { url: mockImageDataUri },
        });

        const result = await generateBackground();

        expect(mockGenerate).toHaveBeenCalledOnce();
        expect(mockGenerate).toHaveBeenCalledWith(expect.objectContaining({
            model: 'googleai/gemini-2.0-flash-preview-image-generation',
            prompt: 'A beautiful, abstract, high-resolution desktop wallpaper. Minimalist and modern, suitable for a computer background.',
        }));
        expect(result).toEqual({ imageDataUri: mockImageDataUri });
    });

    it('should throw an error if image generation fails', async () => {
        mockGenerate.mockResolvedValue({ media: null });

        await expect(generateBackground()).rejects.toThrow('Image generation failed.');
    });
});
