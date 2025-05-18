// src/ai/flows/interpret-issue-command.ts
'use server';

/**
 * @fileOverview Interprets a natural language command related to issue management and returns a structured interpretation.
 *
 * - interpretIssueCommand - A function that interprets the issue command.
 * - InterpretIssueCommandInput - The input type for the interpretIssueCommand function.
 * - InterpretIssueCommandOutput - The return type for the interpretIssueCommand function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const InterpretIssueCommandInputSchema = z.object({
  command: z.string().describe('The natural language command to interpret, e.g., \'assign the bug to John\'.'),
  issueId: z.string().describe('The ID of the issue to which the command applies.')
});
export type InterpretIssueCommandInput = z.infer<typeof InterpretIssueCommandInputSchema>;

const InterpretIssueCommandOutputSchema = z.object({
  action: z.string().describe('The action to take, e.g., \'assign\', \'updateStatus\'.'),
  assignee: z.string().optional().describe('The assignee for the issue, if applicable.'),
  status: z.string().optional().describe('The new status of the issue, if applicable.'),
  field: z.string().optional().describe('The field to update, if applicable'),
  value: z.string().optional().describe('The new value for the field, if applicable')
});
export type InterpretIssueCommandOutput = z.infer<typeof InterpretIssueCommandOutputSchema>;

export async function interpretIssueCommand(input: InterpretIssueCommandInput): Promise<InterpretIssueCommandOutput> {
  return interpretIssueCommandFlow(input);
}

const interpretIssueCommandPrompt = ai.definePrompt({
  name: 'interpretIssueCommandPrompt',
  input: {schema: InterpretIssueCommandInputSchema},
  output: {schema: InterpretIssueCommandOutputSchema},
  prompt: `You are an expert issue management assistant. You will interpret user commands related to issue management and provide a structured output.

  Interpret the following command:
  Command: {{{command}}}
  Issue ID: {{{issueId}}}

  Provide the output in JSON format, following the schema provided.
  If the command does not contain information for a specific field, leave it blank.
`,
});

const interpretIssueCommandFlow = ai.defineFlow(
  {
    name: 'interpretIssueCommandFlow',
    inputSchema: InterpretIssueCommandInputSchema,
    outputSchema: InterpretIssueCommandOutputSchema,
  },
  async input => {
    const {output} = await interpretIssueCommandPrompt(input);
    return output!;
  }
);
