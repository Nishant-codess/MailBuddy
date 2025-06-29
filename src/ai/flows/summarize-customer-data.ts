// Summarize Customer Data Flow
'use server';

/**
 * @fileOverview An AI agent that summarizes customer purchase history to identify key insights and trends.
 *
 * - summarizeCustomerData - A function that summarizes customer purchase history.
 * - SummarizeCustomerDataInput - The input type for the summarizeCustomerData function.
 * - SummarizeCustomerDataOutput - The return type for the summarizeCustomerData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeCustomerDataInputSchema = z.object({
  customerData: z
    .string()
    .describe(
      'The customer purchase history data in CSV format.'
    ),
});
export type SummarizeCustomerDataInput = z.infer<typeof SummarizeCustomerDataInputSchema>;

const SummarizeCustomerDataOutputSchema = z.object({
  summary: z.string().describe('A summary of the key insights and trends from the customer purchase history data.'),
});
export type SummarizeCustomerDataOutput = z.infer<typeof SummarizeCustomerDataOutputSchema>;

export async function summarizeCustomerData(input: SummarizeCustomerDataInput): Promise<SummarizeCustomerDataOutput> {
  return summarizeCustomerDataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeCustomerDataPrompt',
  input: {schema: SummarizeCustomerDataInputSchema},
  output: {schema: SummarizeCustomerDataOutputSchema},
  prompt: `You are an expert marketing analyst. You will analyze customer purchase history data and generate a summary that identifies key insights and trends.

  Here is the customer purchase history data:
  {{customerData}}
  \n  Summary of customer data: `,
});

const summarizeCustomerDataFlow = ai.defineFlow(
  {
    name: 'summarizeCustomerDataFlow',
    inputSchema: SummarizeCustomerDataInputSchema,
    outputSchema: SummarizeCustomerDataOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
