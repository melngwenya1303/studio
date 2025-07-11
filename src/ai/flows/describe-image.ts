'use server';
/**
 * @fileOverview An AI agent that analyzes an image and generates descriptive prompts.
 *
 * - describeImage - A function that generates prompts from an image.
 * - DescribeImageInput - The input type for the describeImage function.
 * - DescribeImageOutput - The return type for the describeImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DescribeImageInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "The image to analyze, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type DescribeImageInput = z.infer<typeof DescribeImageInputSchema>;

const DescribeImageOutputSchema = z.object({
  prompts: z
    .array(z.string())
    .describe('An array of 3 distinct, creative prompts that could have generated the image.'),
});
export type DescribeImageOutput = z.infer<typeof DescribeImageOutputSchema>;

export async function describeImage(input: DescribeImageInput): Promise<DescribeImageOutput> {
  return describeImageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'describeImagePrompt',
  input: {schema: DescribeImageInputSchema},
  output: {schema: DescribeImageOutputSchema},
  prompt: `You are an expert prompt engineer for an image generation service. Analyze the following image and generate 3 distinct, creative, and descriptive text prompts that could have been used to generate this image. Focus on capturing the style, subject, and mood.

Image: {{media url=imageDataUri}}`,
});

const describeImageFlow = ai.defineFlow(
  {
    name: 'describeImageFlow',
    inputSchema: DescribeImageInputSchema,
    outputSchema: DescribeImageOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('The AI failed to generate any prompts. It may have been unable to understand the image.');
    }
    return output;
  }
);
