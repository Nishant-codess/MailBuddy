'use server';
/**
 * @fileOverview An AI agent for generating marketing emails from a custom prompt.
 *
 * - generateEmail - A function that handles the email generation process.
 * - GenerateEmailInput - The input type for the generateEmail function.
 * - GenerateEmailOutput - The return type for the generateEmail function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateEmailInputSchema = z.object({
  prompt: z.string().describe('A custom prompt for generating the marketing email content (e.g., \'Write a funny, Gen Z-friendly marketing email for coffee lovers. Add memes, slang, and emojis\').'),
  customerData: z.string().optional().describe('Optional customer data to personalize the email.'),
});
export type GenerateEmailInput = z.infer<typeof GenerateEmailInputSchema>;

const GenerateEmailOutputSchema = z.object({
  subject: z.string().describe('A catchy and relevant subject line for the email, under 10 words.'),
  emailContent: z.string().describe('The generated marketing email content.'),
});
export type GenerateEmailOutput = z.infer<typeof GenerateEmailOutputSchema>;

export async function generateEmail(input: GenerateEmailInput): Promise<GenerateEmailOutput> {
  return generateEmailFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateEmailPrompt',
  input: {schema: GenerateEmailInputSchema},
  output: {schema: GenerateEmailOutputSchema},
  prompt: `You are a marketing expert specializing in crafting engaging and humorous marketing emails.

You will use the provided prompt to generate a short (under 150 words) and funny email that sounds like it’s written by an internet-savvy brand. Include references to modern pop culture, Gen Z slang, and emojis.

You will also generate a catchy subject line for the email that is under 10 words.

Consider the following customer data if provided to further personalize the email:
{{{customerData}}}

Prompt: {{{prompt}}}`,
});

const generateEmailFlow = ai.defineFlow(
  {
    name: 'generateEmailFlow',
    inputSchema: GenerateEmailInputSchema,
    outputSchema: GenerateEmailOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
