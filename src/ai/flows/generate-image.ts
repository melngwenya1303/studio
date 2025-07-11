'use server';

/**
 * @fileOverview Generates a decal image based on a text prompt.
 *
 * - generateImage - A function that generates an image based on a given prompt.
 * - GenerateImageInput - The input type for the generateImage function, including the prompt.
 * - GenerateImageOutput - The return type for the generateImage function, which is the image data URI.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateImageInputSchema = z.object({
  prompt: z.string().describe('The prompt to use to generate the decal image.'),
});
export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;

const GenerateImageOutputSchema = z.object({
  media: z.string().describe('The generated image as a data URI.'),
});
export type GenerateImageOutput = z.infer<typeof GenerateImageOutputSchema>;

export async function generateImage(input: GenerateImageInput): Promise<GenerateImageOutput> {
  return generateImageFlow(input);
}

const generateImagePrompt = ai.definePrompt({
  name: 'generateImagePrompt',
  input: {schema: GenerateImageInputSchema},
  output: {schema: GenerateImageOutputSchema},
  prompt: `Generate a decal image based on the following prompt: {{{prompt}}}. The output MUST be a data URI representing the generated image.`,
});

const generateImageFlow = ai.defineFlow(
  {
    name: 'generateImageFlow',
    inputSchema: GenerateImageInputSchema,
    outputSchema: GenerateImageOutputSchema,
  },
  async input => {
    const {media} = await ai.generate({
      // IMPORTANT: ONLY the googleai/gemini-2.0-flash-preview-image-generation model is able to generate images. You MUST use exactly this model to generate images.
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: input.prompt,
      config: {
        responseModalities: ['TEXT', 'IMAGE'], // MUST provide both TEXT and IMAGE, IMAGE only won't work
      },
    });

    if (!media?.url) {
       throw new Error('The AI failed to generate an image. This can happen with unusual prompts or if the content violates safety policies. Please try again with a different idea.');
    }
    return {media: media.url};
  }
);
