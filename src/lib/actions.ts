'use server';

import { z } from 'zod';
import { interpretIssueCommand, type InterpretIssueCommandOutput } from '@/ai/flows/interpret-issue-command';
import type { Issue, IssuePriority, IssueStatus } from '@/lib/types';
import { revalidatePath } from 'next/cache';

// Simulate a database or Google Sheets API
// In a real app, this would interact with Google Sheets or a database.
let issuesDB: Issue[] = (await import('@/lib/mock-data')).initialIssues;


export interface CommandActionState {
  status: 'idle' | 'success' | 'error';
  message: string;
  interpretation?: InterpretIssueCommandOutput;
  updatedIssueId?: string;
}

const commandSchema = z.object({
  command: z.string().min(1, 'Command cannot be empty.'),
  issueIdContext: z.string().optional(),
});

export async function processIssueCommandAction(
  prevState: CommandActionState,
  formData: FormData
): Promise<CommandActionState> {
  const validatedFields = commandSchema.safeParse({
    command: formData.get('command'),
    issueIdContext: formData.get('issueIdContext'),
  });

  if (!validatedFields.success) {
    return {
      status: 'error',
      message: validatedFields.error.flatten().fieldErrors.command?.[0] || 'Invalid input.',
    };
  }
  
  const { command, issueIdContext } = validatedFields.data;

  try {
    const interpretation = await interpretIssueCommand({ 
      command, 
      issueId: issueIdContext || "context_not_set" 
    });
    
    // Example: if AI suggests updating status for a specific issue ID parsed.
    // This is a simplified example. A real app would have more robust logic.
    if (interpretation.action === 'updateStatus' && interpretation.status && interpretation.field === 'status') {
        const targetIssueId = interpretation.value?.startsWith('SF-') ? interpretation.value : null; // simplistic id check
        const issueToUpdate = targetIssueId ? issuesDB.find(issue => issue.id === targetIssueId) : null;

        if (issueToUpdate) {
            issueToUpdate.status = interpretation.status as IssueStatus;
            issueToUpdate.updatedAt = new Date().toISOString();
            revalidatePath('/');
             return {
                status: 'success',
                message: `Command interpreted and applied: Status of ${issueToUpdate.id} updated to ${interpretation.status}.`,
                interpretation,
                updatedIssueId: issueToUpdate.id,
            };
        }
    }


    return {
      status: 'success',
      message: 'Command interpreted. Apply changes manually or refine command.',
      interpretation,
    };
  } catch (error) {
    console.error('Error interpreting command:', error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to interpret command. Please try again.',
    };
  }
}


export interface UpdateIssueActionState {
  status: 'idle' | 'success' | 'error';
  message: string;
  issue?: Issue;
}

const updateIssueSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  status: z.custom<IssueStatus>(),
  priority: z.custom<IssuePriority>(),
  assignee: z.string().optional(),
});


export async function updateIssueAction(
    prevState: UpdateIssueActionState,
    formData: FormData
  ): Promise<UpdateIssueActionState> {
    const rawData = {
      id: formData.get('id'),
      title: formData.get('title'),
      description: formData.get('description'),
      status: formData.get('status'),
      priority: formData.get('priority'),
      assignee: formData.get('assignee'),
    };

    const validatedFields = updateIssueSchema.safeParse(rawData);

    if (!validatedFields.success) {
      return {
        status: 'error',
        message: 'Invalid data. ' + JSON.stringify(validatedFields.error.flatten().fieldErrors),
      };
    }

    const data = validatedFields.data;
  
    try {
      const issueIndex = issuesDB.findIndex(issue => issue.id === data.id);
      if (issueIndex === -1) {
        return { status: 'error', message: 'Issue not found.' };
      }
      
      const updatedIssue = {
        ...issuesDB[issueIndex],
        ...data,
        assignee: data.assignee || undefined, // Ensure empty string becomes undefined
        updatedAt: new Date().toISOString(),
      };
      issuesDB[issueIndex] = updatedIssue;
      
      revalidatePath('/'); 
      return { status: 'success', message: 'Issue updated successfully.', issue: updatedIssue };
    } catch (error) {
      console.error('Error updating issue:', error);
      return { status: 'error', message: 'Failed to update issue.' };
    }
  }

  // Function to get current issues (simulates fetching from DB/Sheets)
export async function getIssues(): Promise<Issue[]> {
    // In a real app, fetch from Google Sheets or database
    return Promise.resolve(issuesDB);
}
