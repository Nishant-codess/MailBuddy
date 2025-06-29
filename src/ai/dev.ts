import { config } from 'dotenv';
config();

import '@/ai/flows/generate-email-content.ts';
import '@/ai/flows/generate-email-from-prompt.ts';
import '@/ai/flows/summarize-customer-data.ts';