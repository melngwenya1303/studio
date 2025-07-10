'use server';

/**
 * @fileOverview An AI agent that provides creative feedback on a design prompt.
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
  feedback: z.string().describe('The AI-generated creative feedback and suggestions.'),
});
export type GetCreativeFeedbackOutput = z.infer<typeof GetCreativeFeedbackOutputSchema>;

export async function getCreativeFeedback(input: GetCreativeFeedbackInput): Promise<GetCreativeFeedbackOutput> {
  return getCreativeFeedbackFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getCreativeFeedbackPrompt',
  input: {schema: GetCreativeFeedbackInputSchema},
  output: {schema: GetCreativeFeedbackOutputSchema},
  prompt: `You are an AI Creative Coach and expert art director. A user has created an image based on the following prompt:

"{{{prompt}}}"

Analyze this prompt and provide constructive, inspiring, and actionable feedback. Your goal is to help the user explore new creative directions. Offer 2-3 specific suggestions. For example, suggest different subjects, compositions, color palettes, artistic styles, or moods. Keep the feedback concise and encouraging.

Return only the feedback text.`,
});

const getCreativeFeedbackFlow = ai.defineFlow(
  {
    name: 'getCreativeFeedbackFlow',
    inputSchema: GetCreativeFeedbackInputSchema,
    outputSchema: GetCreativeFeedbackOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
