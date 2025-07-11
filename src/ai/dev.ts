import { config } from 'dotenv';
config();

import '@/ai/flows/generate-image.ts';
import '@/ai/flows/enhance-prompt.ts';
import '@/ai/flows/generate-title.ts';
import '@/ai/flows/describe-image.ts';
import '@/ai/flows/get-creative-feedback.ts';
import '@/ai/flows/generate-story.ts';
import '@/ai/flows/get-remix-suggestions.ts';
import '@/ai/flows/generate-audio.ts';
import '@/ai/flows/generate-ui-spec.ts';
