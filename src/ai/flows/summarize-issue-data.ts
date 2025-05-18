'use server';

/**
 * @fileOverview Summarizes open issues for a project lead.
 *
 * - summarizeIssueData - A function that summarizes open issues.
 * - SummarizeIssueDataInput - The input type for the summarizeIssueData function.
 * - SummarizeIssueDataOutput - The return type for the summarizeIssueData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeIssueDataInputSchema = z.object({
  issues: z
    .string()
    .describe('A list of open issues, each including a title, description, priority, and assignee.'),
});
export type SummarizeIssueDataInput = z.infer<typeof SummarizeIssueDataInputSchema>;

const SummarizeIssueDataOutputSchema = z.object({
  summary: z
    .string()
    .describe('A concise summary of the open issues, highlighting key concerns and overall project status.'),
});
export type SummarizeIssueDataOutput = z.infer<typeof SummarizeIssueDataOutputSchema>;

export async function summarizeIssueData(input: SummarizeIssueDataInput): Promise<SummarizeIssueDataOutput> {
  return summarizeIssueDataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeIssueDataPrompt',
  input: {schema: SummarizeIssueDataInputSchema},
  output: {schema: SummarizeIssueDataOutputSchema},
  prompt: `You are a project management assistant tasked with summarizing open issues for a project lead.\n\nGiven the following list of open issues, provide a concise summary that highlights key concerns and the overall project status.\n\nIssues:\n{{{issues}}}`,
});

const summarizeIssueDataFlow = ai.defineFlow(
  {
    name: 'summarizeIssueDataFlow',
    inputSchema: SummarizeIssueDataInputSchema,
    outputSchema: SummarizeIssueDataOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
