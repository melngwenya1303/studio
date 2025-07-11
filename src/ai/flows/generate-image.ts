'use server';

/**
 * @fileOverview Generates a decal image based on a text prompt, with a content safety check.
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
  media: z.string().optional().describe('The generated image as a data URI.'),
  blocked: z.boolean().describe('Whether the prompt was blocked by the safety filter.'),
  reason: z.string().optional().describe('The reason the prompt was blocked.'),
});
export type GenerateImageOutput = z.infer<typeof GenerateImageOutputSchema>;

// In a real app, this would come from a database or a managed configuration.
const PROHIBITED_WORDS = [
    'disney', 'marvel', 'badword1', 'badword2', 'unwanted',
];

const checkForProhibitedContent = ai.defineTool(
    {
        name: 'checkForProhibitedContent',
        description: 'Checks if the user prompt contains any prohibited words.',
        inputSchema: z.object({ prompt: z.string() }),
        outputSchema: z.object({
            is_prohibited: z.boolean(),
            matched_words: z.array(z.string()),
        }),
    },
    async (input) => {
        const words = input.prompt.toLowerCase().split(/\s+/);
        const matched = PROHIBITED_WORDS.filter(prohibited => words.includes(prohibited));
        return {
            is_prohibited: matched.length > 0,
            matched_words: matched,
        };
    }
);


const imageGenerationPrompt = ai.definePrompt({
    name: 'imageGenerationPrompt',
    input: {schema: GenerateImageInputSchema },
    tools: [checkForProhibitedContent],
    prompt: `First, use the 'checkForProhibitedContent' tool to check if the user's prompt contains any prohibited words.
If it is prohibited, do not generate an image and inform the user why.
If the prompt is not prohibited, generate an image based on the following user prompt: "{{{prompt}}}"
`,
});

export async function generateImage(input: GenerateImageInput): Promise<GenerateImageOutput> {
  return generateImageFlow(input);
}

const generateImageFlow = ai.defineFlow(
  {
    name: 'generateImageFlow',
    inputSchema: GenerateImageInputSchema,
    outputSchema: GenerateImageOutputSchema,
  },
  async (input) => {
    const checkResult = await checkForProhibitedContent(input);

    if (checkResult.is_prohibited) {
        return {
            blocked: true,
            reason: `Your prompt was blocked because it contains the following prohibited term(s): ${checkResult.matched_words.join(', ')}. Please revise your prompt.`,
        };
    }

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
    
    return {
        media: media.url,
        blocked: false
    };
  }
);
