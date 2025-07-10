'use server';

/**
 * @fileOverview An AI agent that enhances decal prompts to improve the quality of generated images.
 *
 * - enhancePrompt - A function that enhances the decal prompt.
 * - EnhancePromptInput - The input type for the enhancePrompt function.
 * - EnhancePromptOutput - The return type for the enhancePrompt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EnhancePromptInputSchema = z.object({
  prompt: z.string().describe('The original user-provided prompt for the decal design.'),
  deviceType: z.string().describe('The type of device the decal is being designed for (e.g., Laptop, Phone).'),
  style: z.string().describe('The artistic style of the decal design (e.g., Photorealistic, Anime).'),
});
export type EnhancePromptInput = z.infer<typeof EnhancePromptInputSchema>;

const EnhancePromptOutputSchema = z.object({
  enhancedPrompt: z.string().describe('The AI-enhanced prompt for generating a higher quality decal image.'),
});
export type EnhancePromptOutput = z.infer<typeof EnhancePromptOutputSchema>;

export async function enhancePrompt(input: EnhancePromptInput): Promise<EnhancePromptOutput> {
  return enhancePromptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'enhancePromptPrompt',
  input: {schema: EnhancePromptInputSchema},
  output: {schema: EnhancePromptOutputSchema},
  prompt: `You are an expert prompt engineer for SurfaceStory. Enhance this user idea for a {{deviceType}} decal into a rich, artistic prompt: "{{{prompt}}}". Style: "{{style}}". Return only the enhanced prompt.`,    
});

const enhancePromptFlow = ai.defineFlow(
  {
    name: 'enhancePromptFlow',
    inputSchema: EnhancePromptInputSchema,
    outputSchema: EnhancePromptOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return {enhancedPrompt: output!.enhancedPrompt};
  }
);
