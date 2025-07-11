// src/ai/flows/generate-title.ts
'use server';
/**
 * @fileOverview A flow that generates a title for a given prompt using Genkit.
 *
 * - generateTitle - A function that generates a title for a design prompt.
 * - GenerateTitleInput - The input type for the generateTitle function.
 * - GenerateTitleOutput - The return type for the generateTitle function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateTitleInputSchema = z.object({
  prompt: z.string().describe('The prompt used to generate the design.'),
});
export type GenerateTitleInput = z.infer<typeof GenerateTitleInputSchema>;

const GenerateTitleOutputSchema = z.object({
  title: z.string().describe('The generated title for the design.'),
});
export type GenerateTitleOutput = z.infer<typeof GenerateTitleOutputSchema>;

export async function generateTitle(input: GenerateTitleInput): Promise<GenerateTitleOutput> {
  return generateTitleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateTitlePrompt',
  input: {schema: GenerateTitleInputSchema},
  output: {schema: GenerateTitleOutputSchema},
  prompt: `You are a creative curator. Based on the prompt "{{{prompt}}}", generate a short, artistic title for this artwork. Return only the title text, no quotes.`,
});

const generateTitleFlow = ai.defineFlow(
  {
    name: 'generateTitleFlow',
    inputSchema: GenerateTitleInputSchema,
    outputSchema: GenerateTitleOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output?.title) {
        throw new Error('The AI failed to generate a title for this prompt.');
    }
    return output;
  }
);
