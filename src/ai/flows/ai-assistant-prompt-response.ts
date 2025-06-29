'use server';
/**
 * @fileOverview AI assistant that provides helpful responses based on user prompts.
 *
 * - aiAssistantPromptResponse - A function that handles the AI assistant prompt response process.
 * - AiAssistantPromptResponseInput - The input type for the aiAssistantPromptResponse function.
 * - AiAssistantPromptResponseOutput - The return type for the aiAssistantPromptResponse function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiAssistantPromptResponseInputSchema = z.object({
  prompt: z.string().describe('The prompt from the user.'),
});
export type AiAssistantPromptResponseInput = z.infer<typeof AiAssistantPromptResponseInputSchema>;

const AiAssistantPromptResponseOutputSchema = z.object({
  response: z.string().describe('The AI assistant response to the prompt.'),
});
export type AiAssistantPromptResponseOutput = z.infer<typeof AiAssistantPromptResponseOutputSchema>;

export async function aiAssistantPromptResponse(input: AiAssistantPromptResponseInput): Promise<AiAssistantPromptResponseOutput> {
  return aiAssistantPromptResponseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiAssistantPrompt',
  input: {schema: AiAssistantPromptResponseInputSchema},
  output: {schema: AiAssistantPromptResponseOutputSchema},
  prompt: `You are a helpful AI assistant. Respond to the following prompt from the user:\n\n{{prompt}}`,
});

const aiAssistantPromptResponseFlow = ai.defineFlow(
  {
    name: 'aiAssistantPromptResponseFlow',
    inputSchema: AiAssistantPromptResponseInputSchema,
    outputSchema: AiAssistantPromptResponseOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
