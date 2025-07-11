'use server';
/**
 * @fileOverview A flow that generates a short story from a prompt and narrates it.
 *
 * - generateStory - A function that generates a story and audio for a design prompt.
 * - GenerateStoryInput - The input type for the generateStory function.
 * - GenerateStoryOutput - The return type for the generateStory function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import wav from 'wav';

const GenerateStoryInputSchema = z.object({
  prompt: z.string().describe('The prompt used to generate the design.'),
});
export type GenerateStoryInput = z.infer<typeof GenerateStoryInputSchema>;

const GenerateStoryOutputSchema = z.object({
  story: z.string().describe('The generated short story or lore for the design.'),
  audio: z.string().describe("The generated audio as a data URI in WAV format."),
});
export type GenerateStoryOutput = z.infer<typeof GenerateStoryOutputSchema>;

export async function generateStory(input: GenerateStoryInput): Promise<GenerateStoryOutput> {
  return generateStoryFlow(input);
}

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    const bufs: any[] = [];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}

const textPrompt = ai.definePrompt({
  name: 'generateStoryTextPrompt',
  input: {schema: GenerateStoryInputSchema},
  output: {schema: z.object({ story: z.string() })},
  prompt: `You are a master storyteller and lore writer. A user has created an artwork based on the following prompt:

"{{{prompt}}}"

Write a short, evocative story or a piece of lore about this artwork. The story should be 2-4 sentences long. Capture the mood and essence of the prompt.

Return only the story text.`,
});

const generateStoryFlow = ai.defineFlow(
  {
    name: 'generateStoryFlow',
    inputSchema: GenerateStoryInputSchema,
    outputSchema: GenerateStoryOutputSchema,
  },
  async input => {
    const textResult = await textPrompt(input);
    const story = textResult.output?.story;

    if (!story) {
        throw new Error('The AI failed to generate a story for this prompt.');
    }

    const {media} = await ai.generate({
      model: 'googleai/gemini-2.5-flash-preview-tts',
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {voiceName: 'Algenib'},
          },
        },
      },
      prompt: story,
    });
    
    if (!media?.url) {
      throw new Error('The AI failed to generate audio for the story.');
    }

    const audioBuffer = Buffer.from(media.url.substring(media.url.indexOf(',') + 1), 'base64');
    const wavBase64 = await toWav(audioBuffer);

    return {
      story,
      audio: `data:audio/wav;base64,${wavBase64}`,
    };
  }
);
