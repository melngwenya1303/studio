
'use server';

/**
 * @fileOverview Generates a decal image based on a text prompt, with a content safety check.
 * This flow is designed to be a "worker" in an asynchronous architecture.
 *
 * - generateImage - A function that generates an image based on a given prompt.
 * - GenerateImageInput - The input type for the generateImage function, including the prompt.
 * - GenerateImageOutput - The return type for the generateImage function, which is the image data URI.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { firebaseApp } from '@/lib/firebase';


const GenerateImageInputSchema = z.object({
  prompt: z.string().describe('The prompt to use to generate the decal image.'),
  baseImageUrl: z.string().optional().describe('The Data URI of an existing image to use as the base for a mockup.'),
  seed: z.number().optional().describe('The seed to use for consistent image generation.'),
});
export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;

const GenerateImageOutputSchema = z.object({
  media: z.string().optional().describe('The generated image as a data URI.'),
  blocked: z.boolean().describe('Whether the prompt was blocked by the safety filter.'),
  reason: z.string().optional().describe('The reason the prompt was blocked.'),
  seed: z.number().optional().describe('The seed used for the generation.'),
});
export type GenerateImageOutput = z.infer<typeof GenerateImageOutputSchema>;

// This tool now fetches the blocklist dynamically from Firestore.
const checkForProhibitedContent = ai.defineTool(
    {
        name: 'checkForProhibitedContent',
        description: 'Checks if the user prompt contains any prohibited words by querying the Firestore blocklist.',
        inputSchema: z.object({ prompt: z.string() }),
        outputSchema: z.object({
            is_prohibited: z.boolean(),
            matched_words: z.array(z.string()),
        }),
    },
    async (input) => {
        const db = getFirestore(firebaseApp);
        const blocklistCol = collection(db, 'blocklist');
        const snapshot = await getDocs(blocklistCol);
        const prohibitedWords = snapshot.docs.map(doc => doc.data().word.toLowerCase());

        const wordsInPrompt = input.prompt.toLowerCase().split(/\s+/);
        const matched = prohibitedWords.filter(prohibited => wordsInPrompt.includes(prohibited));
        
        return {
            is_prohibited: matched.length > 0,
            matched_words: matched,
        };
    }
);

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
    // First, check for any prohibited content. This is a fast check.
    const checkResult = await checkForProhibitedContent({ prompt: input.prompt });

    if (checkResult.is_prohibited) {
        return {
            blocked: true,
            reason: `Your prompt was blocked because it contains the following prohibited term(s): ${checkResult.matched_words.join(', ')}. Please revise your prompt.`,
            seed: input.seed,
        };
    }

    let generationPrompt: any = input.prompt;
    let model = 'googleai/gemini-2.0-flash-preview-image-generation';

    // If a base image is provided, we are generating a lifestyle mockup.
    if (input.baseImageUrl) {
      generationPrompt = [
        { media: { url: input.baseImageUrl } },
        { text: `Generate a realistic lifestyle photo placing this product naturally in the following scene: ${input.prompt}. The product should be the main focus.`},
      ]
    }
    
    // Use the provided seed, or generate a new one for reproducibility.
    const seed = input.seed || Math.floor(Math.random() * 1000000);

    // This is the long-running, computationally intensive part of the job.
    const {media} = await ai.generate({
      model: model,
      prompt: generationPrompt,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
        seed: seed,
      },
    });

    if (!media?.url) {
       throw new Error('The AI failed to generate an image. This can happen with unusual prompts or if the content violates safety policies. Please try again with a different idea.');
    }

    return {
        media: media.url,
        blocked: false,
        seed: seed,
    };
  }
);
