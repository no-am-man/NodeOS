'use server';
/**
 * @fileOverview A Genkit flow that generates a random desktop background image.
 *
 * - generateBackground - A function that handles the image generation process.
 * - GenerateBackgroundOutput - The return type for the generateBackground function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateBackgroundOutputSchema = z.object({
  imageDataUri: z.string().describe("The generated image as a data URI."),
});
export type GenerateBackgroundOutput = z.infer<typeof GenerateBackgroundOutputSchema>;

export async function generateBackground(): Promise<GenerateBackgroundOutput> {
  return generateBackgroundFlow({});
}

const generateBackgroundFlow = ai.defineFlow(
  {
    name: 'generateBackgroundFlow',
    inputSchema: z.object({}),
    outputSchema: GenerateBackgroundOutputSchema,
  },
  async (input) => {
    const {media} = await ai.generate({
      model: 'googleai/imagen-4.0-fast-generate-001',
      prompt: 'A beautiful, abstract, high-resolution desktop wallpaper. Minimalist and modern, suitable for a computer background.',
    });

    if (!media || !media.url) {
        throw new Error('Image generation failed.');
    }

    return { imageDataUri: media.url };
  }
);
