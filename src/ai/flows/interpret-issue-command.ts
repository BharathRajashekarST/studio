
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
  issueId: z.string().describe('A contextual issue ID, primarily for UIs where a command might be issued in the context of a specific issue. For "create" or commands specifying an ID (e.g., "update SF-001"), this may not be used or may be a placeholder.')
});
export type InterpretIssueCommandInput = z.infer<typeof InterpretIssueCommandInputSchema>;

const InterpretIssueCommandOutputSchema = z.object({
  action: z
    .string()
    .describe(
      "The core action to perform. Examples: 'createIssue', 'assignIssue', 'updateIssueStatus', 'updateIssuePriority', 'updateIssueDescription', 'updateIssueTitle'."
    ),
  issueId: z
    .string()
    .optional()
    .describe(
      'The ID of the target issue IF the command refers to an existing issue (e.g., "SF-001" from the command text). For "createIssue", this is usually not provided in the command itself.'
    ),
  title: z
    .string()
    .optional()
    .describe("The title for a new issue, or a new title for an existing issue if action is 'updateIssueTitle'."),
  description: z
    .string()
    .optional()
    .describe("The description for a new issue, or a new description if action is 'updateIssueDescription'."),
  assignee: z
    .string()
    .optional()
    .describe("The name of the person to assign the issue to. Used with 'createIssue' or 'assignIssue' actions."),
  status: z
    .string()
    .optional()
    .describe("The new status for the issue (e.g., 'To Do', 'In Progress', 'Done'). Used with 'createIssue' or 'updateIssueStatus' actions."),
  priority: z
    .string()
    .optional()
    .describe("The new priority for the issue (e.g., 'Low', 'Medium', 'High', 'Urgent'). Used with 'createIssue' or 'updateIssuePriority' actions."),
});
export type InterpretIssueCommandOutput = z.infer<typeof InterpretIssueCommandOutputSchema>;

export async function interpretIssueCommand(input: InterpretIssueCommandInput): Promise<InterpretIssueCommandOutput> {
  return interpretIssueCommandFlow(input);
}

const interpretIssueCommandPrompt = ai.definePrompt({
  name: 'interpretIssueCommandPrompt',
  input: {schema: InterpretIssueCommandInputSchema},
  output: {schema: InterpretIssueCommandOutputSchema},
  prompt: `You are an expert issue management assistant. Your task is to interpret user commands related to issue management and provide a structured JSON output according to the schema provided.

User Command: "{{{command}}}"
Contextual Issue ID (this is ONLY a fallback if the command itself doesn't specify an issue ID for an update/assignment action, and should be ignored if it's a placeholder like 'NO_CONTEXT_ID' or 'CREATE_CONTEXT'): "{{{issueId}}}"

Based on the User Command, determine the 'action' and extract relevant details.

Possible Actions & Expected Fields in Output:
- 'createIssue': If the command is to create a new issue.
    - The 'title' MUST be ONLY the content extracted from the first single or double quoted string in the command. For example, if the command is "create issue 'Fix the login button' with high priority", the title is 'Fix the login button'.
    - After extracting the title, parse the remainder of the command for 'description' (optional), 'assignee' (optional, e.g., from "assign to John Doe" or "assign to unassigned"), 'status' (optional, defaults to 'To Do' if not specified, e.g., from "status In Progress"), 'priority' (optional, defaults to 'Medium' if not specified, e.g., from "priority High").
    - The 'issueId' field in the output should be omitted for 'createIssue' as it's system-generated.
- 'assignIssue': If the command is to assign an existing issue to someone.
    - Extract: 'issueId' (the ID of the issue to assign, e.g., "SF-001", parsed from the command), 'assignee' (required, e.g., from "assign to John Doe" or "assign to unassigned").
- 'updateIssueStatus': If the command is to change the status of an existing issue.
    - Extract: 'issueId' (the ID of the issue to update, parsed from the command), 'status' (required, e.g., "Done", "In Progress").
- 'updateIssuePriority': If the command is to change the priority of an existing issue.
    - Extract: 'issueId' (the ID of the issue to update, parsed from the command), 'priority' (required, e.g., "High", "Low").
- 'updateIssueDescription': If the command is to change the description of an existing issue.
    - Extract: 'issueId' (the ID of the issue to update, parsed from the command), 'description' (required).
- 'updateIssueTitle': If the command is to change the title of an existing issue.
    - Extract: 'issueId' (the ID of the issue to update, parsed from the command), 'title' (required).

General Instructions:
- If the User Command explicitly mentions an issue ID (like "SF-001", "ticket 123"), use that as the 'issueId' in your output for update/assign actions.
- If the User Command is an update/assign action but doesn't specify an issue ID, AND a 'Contextual Issue ID' ({{{issueId}}}) is available and not a placeholder (like 'NO_CONTEXT_ID', 'CREATE_CONTEXT'), you may use that 'Contextual Issue ID' as the 'issueId' in your output. Otherwise, if no ID is found for an update/assign action, the command may be unfulfillable.
- If an assignee is explicitly stated as "unassigned" in the command (e.g., "assign to unassigned"), the 'assignee' field in the output should be the string "unassigned".
- Only include fields in the JSON output that are relevant to the detected action and have been extracted from the command. Omit fields if the information is not present or not applicable.
- Ensure the output is valid JSON.
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
    if (!output) {
      throw new Error('AI interpretation failed to produce a valid output based on the schema.');
    }
    // For createIssue, ensure title is present
    if (output.action === 'createIssue' && (!output.title || output.title.trim() === '')) {
        // If AI failed to extract a title for createIssue, even after prompt guidance
        throw new Error("AI interpretation failed: Title is missing for 'createIssue' action.");
    }
    return output;
  }
);

