'use server';

/**
 * @fileOverview An AI agent that provides creative suggestions for remixing a design.
 *
 * - getRemixSuggestions - A function that returns suggestions for a given prompt.
 * - GetRemixSuggestionsInput - The input type for the getRemixSuggestions function.
 * - GetRemixSuggestionsOutput - The return type for the getRemixSuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GetRemixSuggestionsInputSchema = z.object({
  prompt: z.string().describe('The user-provided prompt for the decal design.'),
});
export type GetRemixSuggestionsInput = z.infer<typeof GetRemixSuggestionsInputSchema>;

const GetRemixSuggestionsOutputSchema = z.object({
  suggestions: z.array(z.string()).describe('An array of 3 distinct, creative suggestions for remixing the prompt.'),
});
export type GetRemixSuggestionsOutput = z.infer<typeof GetRemixSuggestionsOutputSchema>;

export async function getRemixSuggestions(input: GetRemixSuggestionsInput): Promise<GetRemixSuggestionsOutput> {
  return getRemixSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getRemixSuggestionsPrompt',
  input: {schema: GetRemixSuggestionsInputSchema},
  output: {schema: GetRemixSuggestionsOutputSchema},
  prompt: `You are an AI Creative Coach. A user wants to remix an artwork created with the prompt:

"{{{prompt}}}"

Provide 3 specific, creative, and actionable suggestions for how they could remix this. The suggestions should be short phrases. For example: "Change the time of day to sunset," "Add a mythical creature," or "View from a low angle."

Return only the suggestions.`,
});

const getRemixSuggestionsFlow = ai.defineFlow(
  {
    name: 'getRemixSuggestionsFlow',
    inputSchema: GetRemixSuggestionsInputSchema,
    outputSchema: GetRemixSuggestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('The AI failed to generate any suggestions. Please try a different prompt.');
    }
    return output;
  }
);
