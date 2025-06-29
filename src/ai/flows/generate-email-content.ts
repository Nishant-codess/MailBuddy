'use server';

/**
 * @fileOverview A Genkit flow for generating funny, Gen Z-friendly marketing email content with memes, slang, and emojis based on customer data using AI.
 *
 * - generateEmailContent - A function that generates email content based on customer data.
 * - GenerateEmailContentInput - The input type for the generateEmailContent function.
 * - GenerateEmailContentOutput - The return type for the generateEmailContent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateEmailContentInputSchema = z.object({
  customerData: z.record(z.any()).describe('Customer data in JSON format.'),
  productName: z.string().describe('The name of the product to promote.'),
  promptOverrides: z.string().optional().describe("Overrides to the default prompt to make the email more specific."),
});
export type GenerateEmailContentInput = z.infer<typeof GenerateEmailContentInputSchema>;

const GenerateEmailContentOutputSchema = z.object({
  emailContent: z.string().describe('The generated email content.'),
});
export type GenerateEmailContentOutput = z.infer<typeof GenerateEmailContentOutputSchema>;

export async function generateEmailContent(input: GenerateEmailContentInput): Promise<GenerateEmailContentOutput> {
  return generateEmailContentFlow(input);
}

const generateEmailContentPrompt = ai.definePrompt({
  name: 'generateEmailContentPrompt',
  input: {schema: GenerateEmailContentInputSchema},
  output: {schema: GenerateEmailContentOutputSchema},
  prompt: `You are a marketing expert specializing in creating funny, Gen Z-friendly marketing emails. Your emails will include memes, slang, and emojis.

  Here are some guidelines:
  - Keep the email short (under 150 words).
  - Sound like it’s written by a funny internet-savvy brand.
  - Use modern pop culture references, Gen Z slang, and emojis.
  - Use the customer data provided to personalize the email. 

  Customer Data: {{{customerData}}}
  Product Name: {{{productName}}}

  {{#if promptOverrides}}
  Prompt Overrides: {{{promptOverrides}}}
  {{/if}}

  Write a funny, Gen Z-friendly marketing email to promote the product to the customer.`, // eslint-disable-line max-len
});

const generateEmailContentFlow = ai.defineFlow(
  {
    name: 'generateEmailContentFlow',
    inputSchema: GenerateEmailContentInputSchema,
    outputSchema: GenerateEmailContentOutputSchema,
  },
  async input => {
    const {output} = await generateEmailContentPrompt(input);
    return output!;
  }
);
