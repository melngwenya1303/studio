
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
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { firebaseApp } from '@/lib/firebase';


const GenerateImageInputSchema = z.object({
  prompt: z.string().describe('The prompt to use to generate the decal image.'),
  baseImageUrl: z.string().optional().describe('The Data URI of an existing image to use as the base for a mockup.'),
});
export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;

const GenerateImageOutputSchema = z.object({
  media: z.string().optional().describe('The generated image as a data URI.'),
  blocked: z.boolean().describe('Whether the prompt was blocked by the safety filter.'),
  reason: z.string().optional().describe('The reason the prompt was blocked.'),
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
        const blocklistSnapshot = await getDocs(blocklistCol);
        const prohibitedWords = blocklistSnapshot.docs.map(doc => doc.data().word.toLowerCase());

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
    // LAUNCH ENHANCEMENT: For the mockup generation feature, this flow must be
    // enhanced to support a fully asynchronous architecture.
    // The current simulation should be replaced with a robust system using
    // Google Cloud services.
    //
    // The target architecture is:
    // 1. A lightweight HTTP-triggered Cloud Function that acts as the API endpoint.
    // 2. This function validates the request and creates a job document in Firestore
    //    with a 'pending' status.
    // 3. The function then pushes the job details (e.g., prompt, baseImageUrl, userId)
    //    to a Cloud Tasks queue.
    // 4. A separate, long-running Cloud Function (worker) will be triggered by messages
    //    from the Cloud Tasks queue to perform the actual image generation.
    // 5. Upon completion, the worker function will update the Firestore job
    //    document with the final image URL and a 'completed' status.
    // This ensures the frontend remains responsive and the platform can scale.

    const checkResult = await checkForProhibitedContent({ prompt: input.prompt });

    if (checkResult.is_prohibited) {
        return {
            blocked: true,
            reason: `Your prompt was blocked because it contains the following prohibited term(s): ${checkResult.matched_words.join(', ')}. Please revise your prompt.`,
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

    // The actual generation is now "awaited" as if it's a background job completing.
    const {media} = await ai.generate({
      model: model,
      prompt: generationPrompt,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
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
