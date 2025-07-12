'use server';
/**
 * @fileOverview A flow that generates a UI spec from a prompt.
 *
 * This flow takes a user prompt and generates a title, story, and image for a decal design.
 * The narrated audio is no longer generated here to avoid rate-limiting; it's generated on-demand in the UI.
 *
 * - generateUiSpec - The main function to generate the UI spec.
 * - GenerateUiSpecInput - The input type for the generateUiSpec function.
 * - GenerateUiSpecOutput - The return type for the generateUiSpec function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {generateImage} from './generate-image';
import {generateTitle} from './generate-title';

// Input and Output Schemas
const GenerateUiSpecInputSchema = z.object({
  prompt: z.string().describe('The user-provided prompt for the decal design.'),
});
export type GenerateUiSpecInput = z.infer<typeof GenerateUiSpecInputSchema>;

const StoryPromptSchema = z.object({
  prompt: z.string(),
});

const StoryOutputSchema = z.object({
    story: z.string().describe('A 2-4 sentence story or lore about the design.'),
});

const storyPrompt = ai.definePrompt({
    name: 'generateStoryTextOnlyPrompt',
    input: {schema: StoryPromptSchema},
    output: {schema: StoryOutputSchema},
    prompt: `You are a master storyteller and lore writer. A user has created an artwork based on the following prompt:

"{{{prompt}}}"

Write a short, evocative story or a piece of lore about this artwork. The story should be 2-4 sentences long. Capture the mood and essence of the prompt.

Return only the story text.`,
});


const GenerateUiSpecOutputSchema = z.object({
  title: z.string().describe('A short, creative title for the design.'),
  story: z.string().describe('A 2-4 sentence story or lore about the design.'),
  imageUrl: z.string().describe('The data URI of the generated decal image.'),
  blocked: z.boolean().describe('Whether the prompt was blocked by the safety filter.'),
  blockedReason: z.string().optional().describe('The reason the prompt was blocked.'),
});
export type GenerateUiSpecOutput = z.infer<typeof GenerateUiSpecOutputSchema>;

// Main exported function
export async function generateUiSpec(input: GenerateUiSpecInput): Promise<GenerateUiSpecOutput> {
  return generateUiSpecFlow(input);
}

// Genkit Flow Definition
const generateUiSpecFlow = ai.defineFlow(
  {
    name: 'generateUiSpecFlow',
    inputSchema: GenerateUiSpecInputSchema,
    outputSchema: GenerateUiSpecOutputSchema,
  },
  async input => {
    // Run image generation first to check for blocked content
    const imageResult = await generateImage({ prompt: input.prompt });
    
    if (imageResult.blocked || !imageResult.media) {
      return {
        title: 'Blocked',
        story: '',
        imageUrl: '',
        blocked: true,
        blockedReason: imageResult.reason || 'The AI failed to generate an image. This can happen with unusual prompts or if the content violates safety policies. Please try again with a different idea.',
      };
    }
    
    // If not blocked, proceed with title and story generation in parallel
    const [titleResult, storyResult] = await Promise.all([
      generateTitle(input),
      storyPrompt(input),
    ]);

    const title = titleResult.title;
    const story = storyResult.output?.story;
    const imageUrl = imageResult.media;

    // Validate results
    if (!title) {
      throw new Error('The AI failed to generate a title for this prompt.');
    }
     if (!story) {
      throw new Error('The AI failed to generate a story.');
    }

    return {title, story, imageUrl, blocked: false };
  }
);
