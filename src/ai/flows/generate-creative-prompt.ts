'use server';
/**
 * @fileOverview A flow that generates a random, creative prompt for image generation.
 *
 * - generateCreativePrompt - A function that returns a single creative prompt.
 * - GenerateCreativePromptOutput - The return type for the generateCreativePrompt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateCreativePromptOutputSchema = z.object({
  prompt: z.string().describe('A single, creative, and surprising prompt suitable for an image generation tool. It should be a short, high-concept phrase.'),
});
export type GenerateCreativePromptOutput = z.infer<typeof GenerateCreativePromptOutputSchema>;

export async function generateCreativePrompt(): Promise<GenerateCreativePromptOutput> {
  return generateCreativePromptFlow();
}

const prompt = ai.definePrompt({
  name: 'generateCreativePrompt',
  output: {schema: GenerateCreativePromptOutputSchema},
  prompt: `You are an AI idea generator for an image creation service. Your task is to invent a single, short, surprising, and visually interesting prompt.

Examples:
- A library inside a giant, ancient tree.
- A raccoon astronaut planting a flag on a planet made of cheese.
- A city built on the back of a colossal, sleeping turtle.
- A steampunk octopus operating a submarine.

Generate a new, unique prompt now.`,
});

const generateCreativePromptFlow = ai.defineFlow(
  {
    name: 'generateCreativePromptFlow',
    outputSchema: GenerateCreativePromptOutputSchema,
  },
  async () => {
    const {output} = await prompt();
    if (!output?.prompt) {
        throw new Error('The AI failed to generate a creative prompt.');
    }
    return output;
  }
);
