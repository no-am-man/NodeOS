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
    // By not specifying a model, we use the default model configured in genkit.ts
    // This is more robust against model deprecation issues.
    const {media} = await ai.generate({
      prompt: 'A beautiful, abstract, high-resolution desktop wallpaper. Minimalist and modern, suitable for a computer background.',
      config: {
        responseModalities: ['IMAGE'],
      },
    });

    if (!media || !media.url) {
        throw new Error('Image generation failed.');
    }

    return { imageDataUri: media.url };
  }
);
