
'use server';
/**
 * @fileOverview A flow that generates a UI spec from a prompt.
 *
 * This flow takes a user prompt and generates a title, story, and image for a decal design.
 * It's designed to simulate a scalable, asynchronous backend architecture.
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
  style: z.string().optional().describe('The artistic style for the decal.'),
  deviceType: z.string().optional().describe('The target device for the decal.'),
  setting: z.string().optional().describe('The setting or background for the subject.'),
  negativePrompt: z.string().optional().describe('Elements to exclude from the image.'),
  seed: z.number().optional().describe('The seed for consistent image generation.'),
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
  seed: z.number().optional().describe('The seed used for the generation.'),
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
    // This flow simulates a robust, asynchronous backend job queue.
    // TARGET ARCHITECTURE:
    // 1. Client sends request to a lightweight HTTP Cloud Function (API Endpoint).
    // 2. API Endpoint validates the request, creates a 'job' doc in Firestore
    //    with 'pending' status, and pushes the job to a message queue (e.g., BullMQ/Redis).
    // 3. A separate, long-running Worker Process (Cloud Run) picks up the job
    //    from the queue and begins the AI generation.
    // 4. The worker updates the Firestore doc with the final image URL and 'completed' status.
    // 5. The client listens for real-time updates on the Firestore doc and displays the image when ready.
    //
    // The Promise.all below simulates the parallel processing of different parts of the job
    // by the worker process.

    let finalPrompt = input.prompt;
    if (input.setting || input.style || input.deviceType) {
        finalPrompt = `A decal design for a ${input.deviceType}, ${input.prompt}, ${input.setting || ''}, in the style of ${input.style}.`;
    }
    if (input.negativePrompt) {
        finalPrompt += ` --no ${input.negativePrompt}`;
    }

    // Run all generation tasks in parallel to simulate an asynchronous worker.
    const [imageResult, titleResult, storyResult] = await Promise.all([
        generateImage({ prompt: finalPrompt, seed: input.seed }),
        generateTitle({ prompt: finalPrompt }),
        storyPrompt({ prompt: finalPrompt }),
    ]);

    // Handle content blocking from the image generation.
    if (imageResult.blocked || !imageResult.media) {
      return {
        title: 'Blocked',
        story: '',
        imageUrl: '',
        blocked: true,
        blockedReason: imageResult.reason || 'The AI failed to generate an image. This can happen with unusual prompts or if the content violates safety policies. Please try again with a different idea.',
        seed: imageResult.seed,
      };
    }
    
    const title = titleResult.title;
    const story = storyResult.output?.story;
    const imageUrl = imageResult.media;

    // Validate all parts of the job completed successfully.
    if (!title) throw new Error('The AI failed to generate a title for this prompt.');
    if (!story) throw new Error('The AI failed to generate a story.');
    
    return {
      title, 
      story, 
      imageUrl, 
      blocked: false, 
      seed: imageResult.seed 
    };
  }
);
