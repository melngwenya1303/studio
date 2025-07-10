
'use server';

/**
 * @fileOverview An AI agent that provides creative feedback and prompt editing suggestions.
 *
 * - getCreativeFeedback - A function that returns feedback for a given prompt.
 * - GetCreativeFeedbackInput - The input type for the getCreativeFeedback function.
 * - GetCreativeFeedbackOutput - The return type for the getCreativeFeedback function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GetCreativeFeedbackInputSchema = z.object({
  prompt: z.string().describe('The user-provided prompt for the decal design.'),
});
export type GetCreativeFeedbackInput = z.infer<typeof GetCreativeFeedbackInputSchema>;

const GetCreativeFeedbackOutputSchema = z.object({
  suggestions: z
    .array(z.string())
    .describe('An array of 3 distinct, actionable suggestions to edit or enhance the prompt.'),
});
export type GetCreativeFeedbackOutput = z.infer<typeof GetCreativeFeedbackOutputSchema>;

export async function getCreativeFeedback(input: GetCreativeFeedbackInput): Promise<GetCreativeFeedbackOutput> {
  return getCreativeFeedbackFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getCreativeFeedbackPrompt',
  input: {schema: GetCreativeFeedbackInputSchema},
  output: {schema: GetCreativeFeedbackOutputSchema},
  prompt: `You are an AI Prompt Editor. A user has created an image based on the following prompt:

"{{{prompt}}}"

Your goal is to help the user iterate and refine their idea. Provide 3 specific, creative, and actionable suggestions for how they could edit this prompt. The suggestions should be short, complete phrases that could be used as a new prompt. For example, if the prompt is "a cat", you might suggest "a cat wearing a tiny hat" or "a cyberpunk cat in a neon-lit alley".

Return only the suggestions.`,
});

const getCreativeFeedbackFlow = ai.defineFlow(
  {
    name: 'getCreativeFeedbackFlow',
    inputSchema: GetCreativeFeedbackInputSchema,
    outputSchema: GetCreativeFeedbackOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('The AI failed to generate any suggestions.');
    }
    return output;
  }
);
