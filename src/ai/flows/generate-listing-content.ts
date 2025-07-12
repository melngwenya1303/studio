
'use server';

/**
 * @fileOverview An AI agent that generates optimized e-commerce listing content.
 *
 * - generateListingContent - A function that generates a title or description for a product.
 * - GenerateListingContentInput - The input type for the function.
 * - GenerateListingContentOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateListingContentInputSchema = z.object({
  prompt: z.string().describe('The original prompt used to create the design.'),
  contentType: z.enum(['title', 'description']).describe('The type of content to generate.'),
});
export type GenerateListingContentInput = z.infer<typeof GenerateListingContentInputSchema>;

const GenerateListingContentOutputSchema = z.object({
  content: z.string().describe('The generated SEO-friendly content.'),
});
export type GenerateListingContentOutput = z.infer<typeof GenerateListingContentOutputSchema>;

export async function generateListingContent(input: GenerateListingContentInput): Promise<GenerateListingContentOutput> {
  return generateListingContentFlow(input);
}

const titlePrompt = `You are an expert e-commerce copywriter specializing in SEO. Based on the artwork prompt "{{{prompt}}}", generate 5 catchy, SEO-friendly, and commercially viable product titles. The titles should be diverse in style. Return only the titles as a JSON array of strings.`;
const descriptionPrompt = `You are an expert e-commerce copywriter specializing in SEO. Based on the artwork prompt "{{{prompt}}}", generate a compelling, detailed, and SEO-friendly product description. The description should evoke emotion and highlight the unique aspects of the design. Start with a strong hook and include a bulleted list of 2-3 key features. Keep it under 100 words.`;

const generateListingContentFlow = ai.defineFlow(
  {
    name: 'generateListingContentFlow',
    inputSchema: GenerateListingContentInputSchema,
    outputSchema: GenerateListingContentOutputSchema,
  },
  async ({ prompt, contentType }) => {

    const selectedPrompt = contentType === 'title' ? titlePrompt : descriptionPrompt;

    const { output } = await ai.generate({
      prompt: selectedPrompt.replace('{{{prompt}}}', prompt),
    });

    if (!output) {
      throw new Error('The AI failed to generate content.');
    }

    return { content: output };
  }
);
