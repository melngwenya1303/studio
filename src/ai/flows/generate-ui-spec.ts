'use server';
/**
 * @fileOverview A flow that generates a UI spec from a prompt.
 *
 * This flow takes a user prompt and generates a title, story, and image for a decal design.
 *
 * - generateUiSpec - The main function to generate the UI spec.
 * - GenerateUiSpecInput - The input type for the generateUiSpec function.
 * - GenerateUiSpecOutput - The return type for the generateUiSpec function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Input and Output Schemas
const GenerateUiSpecInputSchema = z.object({
  prompt: z.string().describe('The user-provided prompt for the decal design.'),
});
export type GenerateUiSpecInput = z.infer<typeof GenerateUiSpecInputSchema>;

const GenerateUiSpecOutputSchema = z.object({
  title: z.string().describe('A short, creative title for the design.'),
  story: z.string().describe('A 2-4 sentence story or lore about the design.'),
  imageUrl: z.string().describe('The data URI of the generated decal image.'),
});
export type GenerateUiSpecOutput = z.infer<typeof GenerateUiSpecOutputSchema>;

// Main exported function
export async function generateUiSpec(input: GenerateUiSpecInput): Promise<GenerateUiSpecOutput> {
  return generateUiSpecFlow(input);
}

// Genkit Prompt for Text Generation (Title and Story)
const textPrompt = ai.definePrompt({
  name: 'generateUiTextPrompt',
  input: {schema: GenerateUiSpecInputSchema},
  output: {
    schema: z.object({
      title: z.string(),
      story: z.string(),
    }),
  },
  prompt: `You are a creative director. Based on the following prompt, generate an artistic title and a short, evocative story (2-4 sentences) for an artwork.

Prompt: "{{{prompt}}}"

Return only the title and story.`,
});

// Genkit Flow Definition
const generateUiSpecFlow = ai.defineFlow(
  {
    name: 'generateUiSpecFlow',
    inputSchema: GenerateUiSpecInputSchema,
    outputSchema: GenerateUiSpecOutputSchema,
  },
  async input => {
    // Execute text and image generation in parallel
    const [textResult, imageResult] = await Promise.all([
      textPrompt(input),
      ai.generate({
        model: 'googleai/gemini-2.0-flash-preview-image-generation',
        prompt: input.prompt,
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
      }),
    ]);

    const title = textResult.output?.title;
    const story = textResult.output?.story;
    const imageUrl = imageResult.media?.url;

    // Validate results
    if (!title || !story) {
      throw new Error('The AI failed to generate a title or story for this prompt.');
    }
    if (!imageUrl) {
      throw new Error(
        'The AI failed to generate an image. This can happen with unusual prompts or if the content violates safety policies. Please try again with a different idea.'
      );
    }

    return {title, story, imageUrl};
  }
);
