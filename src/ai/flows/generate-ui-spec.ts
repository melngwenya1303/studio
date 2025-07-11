'use server';
/**
 * @fileOverview A flow that generates a UI spec from a prompt.
 *
 * This flow takes a user prompt and generates a title, story, image, and narrated audio for a decal design.
 *
 * - generateUiSpec - The main function to generate the UI spec.
 * - GenerateUiSpecInput - The input type for the generateUiSpec function.
 * - GenerateUiSpecOutput - The return type for the generateUiSpec function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {generateStory} from './generate-story';

// Input and Output Schemas
const GenerateUiSpecInputSchema = z.object({
  prompt: z.string().describe('The user-provided prompt for the decal design.'),
});
export type GenerateUiSpecInput = z.infer<typeof GenerateUiSpecInputSchema>;

const GenerateUiSpecOutputSchema = z.object({
  title: z.string().describe('A short, creative title for the design.'),
  story: z.string().describe('A 2-4 sentence story or lore about the design.'),
  imageUrl: z.string().describe('The data URI of the generated decal image.'),
  storyAudio: z.string().describe('A data URI for the narrated story audio.'),
});
export type GenerateUiSpecOutput = z.infer<typeof GenerateUiSpecOutputSchema>;

// Main exported function
export async function generateUiSpec(input: GenerateUiSpecInput): Promise<GenerateUiSpecOutput> {
  return generateUiSpecFlow(input);
}

// Genkit Prompt for Text Generation (Title only)
const titlePrompt = ai.definePrompt({
  name: 'generateUiTitlePrompt',
  input: {schema: GenerateUiSpecInputSchema},
  output: {
    schema: z.object({
      title: z.string(),
    }),
  },
  prompt: `You are a creative curator. Based on the prompt "{{{prompt}}}", generate a short, artistic title for this artwork. Return only the title text, no quotes.`,
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
    const [titleResult, storyResult, imageResult] = await Promise.all([
      titlePrompt(input),
      generateStory(input), // This now returns { story, audio }
      ai.generate({
        model: 'googleai/gemini-2.0-flash-preview-image-generation',
        prompt: input.prompt,
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
      }),
    ]);

    const title = titleResult.output?.title;
    const { story, audio: storyAudio } = storyResult;
    const imageUrl = imageResult.media?.url;

    // Validate results
    if (!title) {
      throw new Error('The AI failed to generate a title for this prompt.');
    }
     if (!story || !storyAudio) {
      throw new Error('The AI failed to generate a story or narration.');
    }
    if (!imageUrl) {
      throw new Error(
        'The AI failed to generate an image. This can happen with unusual prompts or if the content violates safety policies. Please try again with a different idea.'
      );
    }

    return {title, story, imageUrl, storyAudio};
  }
);
