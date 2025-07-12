'use server';

/**
 * @fileOverview An experimental flow to generate JSX UI from a text prompt.
 *
 * - promptToUi - Generates JSX based on a description.
 * - PromptToUiInput - Input schema for the flow.
 * - PromptToUiOutput - Output schema for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const PromptToUiInputSchema = z.object({
  prompt: z.string().describe('A detailed description of the UI component to generate.'),
});
export type PromptToUiInput = z.infer<typeof PromptToUiInputSchema>;

export const PromptToUiOutputSchema = z.object({
  jsx: z.string().describe('The generated JSX code as a string.'),
});
export type PromptToUiOutput = z.infer<typeof PromptToUiOutputSchema>;

export async function promptToUi(input: PromptToUiInput): Promise<PromptToUiOutput> {
  return promptToUiFlow(input);
}

const prompt = ai.definePrompt({
  name: 'promptToUiPrompt',
  input: {schema: PromptToUiInputSchema},
  output: {schema: PromptToUiOutputSchema},
  prompt: `You are a UI developer specializing in Next.js, React, and Tailwind CSS with shadcn/ui.
Your task is to convert a user's text description into a single, valid JSX component.

**Guidelines:**
- Use functional components.
- Use Tailwind CSS for styling.
- Use shadcn/ui components where appropriate (e.g., <Button>, <Card>, <Input>).
- Do not include any imports or exports. Return only the JSX code.
- Wrap the entire output in a single root div element.

**User Prompt:**
"{{{prompt}}}"

Generate the JSX now.
`,
});

const promptToUiFlow = ai.defineFlow(
  {
    name: 'promptToUiFlow',
    inputSchema: PromptToUiInputSchema,
    outputSchema: PromptToUiOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output?.jsx) {
      throw new Error('The AI failed to generate any UI.');
    }
    return output;
  }
);
