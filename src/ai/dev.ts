import { config } from 'dotenv';
config();

import '@/ai/flows/generate-email-content.ts';
import '@/ai/flows/generate-email-from-prompt.ts';
import '@/ai/flows/summarize-customer-data.ts';
import '@/ai/flows/send-email.ts';
