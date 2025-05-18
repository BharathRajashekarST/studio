
'use server';

import { z } from 'zod';
import { interpretIssueCommand, type InterpretIssueCommandOutput } from '@/ai/flows/interpret-issue-command';
import type { Issue, IssuePriority, IssueStatus } from '@/lib/types';
import { issuePriorities, issueStatuses } from '@/lib/types'; // Import for validation
import { revalidatePath } from 'next/cache';

// Simulate a database or Google Sheets API
// In a real app, this would interact with Google Sheets or a database.
let issuesDB: Issue[] = (await import('@/lib/mock-data')).initialIssues;


export interface CommandActionState {
  status: 'idle' | 'success' | 'error';
  message: string;
  interpretation?: InterpretIssueCommandOutput;
  updatedIssueId?: string; // Could be new or existing ID
}

const commandSchema = z.object({
  command: z.string().min(1, 'Command cannot be empty.'),
});

// Helper function to generate a new issue ID
function generateNewIssueId(existingIssues: Issue[]): string {
  const numericIds = existingIssues
    .map(issue => {
      const match = issue.id.match(/^SF-(\d+)$/);
      return match ? parseInt(match[1], 10) : NaN;
    })
    .filter(id => !isNaN(id));
  const maxId = numericIds.length > 0 ? Math.max(...numericIds) : 0;
  return `SF-${(maxId + 1).toString().padStart(3, '0')}`;
}

// Special value used by forms for "Unassigned" option, needs to be consistent with frontend components
const UNASSIGNED_FORM_VALUE = "_SELECT_UNASSIGNED_";

export async function processIssueCommandAction(
  prevState: CommandActionState,
  formData: FormData
): Promise<CommandActionState> {
  const rawCommand = formData.get('command');
  const issueIdContextFromForm = formData.get('issueIdContext') as string | null;

  const validatedFields = commandSchema.safeParse({
    command: rawCommand,
  });

  if (!validatedFields.success) {
    return {
      status: 'error',
      message: validatedFields.error.flatten().fieldErrors.command?.[0] || 'Invalid input.',
    };
  }
  
  const { command } = validatedFields.data;

  try {
    const interpretation = await interpretIssueCommand({ 
      command, 
      issueId: issueIdContextFromForm || "NO_CONTEXT_ID" 
    });
    
    let updatedIssueId: string | undefined = undefined;

    if (interpretation.action === 'createIssue') {
      if (!interpretation.title) {
        return { status: 'error', message: 'Cannot create issue: Title is missing from AI interpretation.', interpretation };
      }
      const newIssueId = generateNewIssueId(issuesDB);
      const newIssue: Issue = {
        id: newIssueId,
        title: interpretation.title,
        description: interpretation.description || '',
        status: (issueStatuses.includes(interpretation.status as IssueStatus) ? interpretation.status : 'To Do') as IssueStatus,
        priority: (issuePriorities.includes(interpretation.priority as IssuePriority) ? interpretation.priority : 'Medium') as IssuePriority,
        assignee: interpretation.assignee === 'unassigned' || !interpretation.assignee ? undefined : interpretation.assignee, 
        reporter: 'AI Command Bar', 
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        labels: [], 
      };
      issuesDB.unshift(newIssue);
      updatedIssueId = newIssueId;
      revalidatePath('/');
      return {
        status: 'success',
        message: `New issue ${newIssueId}: "${newIssue.title}" created.`,
        updatedIssueId,
        interpretation, 
      };
    } else if (interpretation.issueId) {
      const issueToUpdate = issuesDB.find(issue => issue.id === interpretation.issueId);
      if (!issueToUpdate) {
        return { status: 'error', message: `Issue ${interpretation.issueId} not found.`, interpretation };
      }
      updatedIssueId = issueToUpdate.id;

      if (interpretation.action === 'assignIssue' && interpretation.assignee) {
        issueToUpdate.assignee = interpretation.assignee === 'unassigned' || !interpretation.assignee ? undefined : interpretation.assignee;
        issueToUpdate.updatedAt = new Date().toISOString();
        revalidatePath('/');
        return {
          status: 'success',
          message: `Issue ${issueToUpdate.id} assigned to ${interpretation.assignee === 'unassigned' ? 'Unassigned' : interpretation.assignee}.`,
          interpretation,
          updatedIssueId,
        };
      } else if (interpretation.action === 'updateIssueStatus' && interpretation.status) {
        if (!issueStatuses.includes(interpretation.status as IssueStatus)) {
            return { status: 'error', message: `Invalid status: ${interpretation.status}. Valid are: ${issueStatuses.join(', ')}`, interpretation };
        }
        issueToUpdate.status = interpretation.status as IssueStatus;
        issueToUpdate.updatedAt = new Date().toISOString();
        revalidatePath('/');
        return {
          status: 'success',
          message: `Status of ${issueToUpdate.id} updated to ${interpretation.status}.`,
          interpretation,
          updatedIssueId,
        };
      } else if (interpretation.action === 'updateIssuePriority' && interpretation.priority) {
         if (!issuePriorities.includes(interpretation.priority as IssuePriority)) {
            return { status: 'error', message: `Invalid priority: ${interpretation.priority}. Valid are: ${issuePriorities.join(', ')}`, interpretation };
        }
        issueToUpdate.priority = interpretation.priority as IssuePriority;
        issueToUpdate.updatedAt = new Date().toISOString();
        revalidatePath('/');
        return {
          status: 'success',
          message: `Priority of ${issueToUpdate.id} updated to ${interpretation.priority}.`,
          interpretation,
          updatedIssueId,
        };
      } else if (interpretation.action === 'updateIssueDescription' && typeof interpretation.description === 'string') {
        issueToUpdate.description = interpretation.description;
        issueToUpdate.updatedAt = new Date().toISOString();
        revalidatePath('/');
        return {
          status: 'success',
          message: `Description of ${issueToUpdate.id} updated.`,
          interpretation,
          updatedIssueId,
        };
      } else if (interpretation.action === 'updateIssueTitle' && interpretation.title) {
        issueToUpdate.title = interpretation.title;
        issueToUpdate.updatedAt = new Date().toISOString();
        revalidatePath('/');
        return {
          status: 'success',
          message: `Title of ${issueToUpdate.id} updated.`,
          interpretation,
          updatedIssueId,
        };
      }
      return {
        status: 'success', 
        message: `Command interpreted for issue ${interpretation.issueId}. Action '${interpretation.action}' processed.`,
        interpretation,
        updatedIssueId,
      };

    }

    return {
      status: 'success',
      message: 'Command interpreted. Review interpretation below. No specific database action taken.',
      interpretation,
    };
  } catch (error) {
    console.error('Error processing command:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to process command. Please try again.';
    return {
      status: 'error',
      message: errorMessage,
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
  status: z.custom<IssueStatus>((val) => issueStatuses.includes(val as IssueStatus), "Invalid status value"),
  priority: z.custom<IssuePriority>((val) => issuePriorities.includes(val as IssuePriority), "Invalid priority value"),
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
      let errorMessages = "Invalid data: ";
      const fieldErrors = validatedFields.error.flatten().fieldErrors;
      for (const key in fieldErrors) {
          if (fieldErrors[key as keyof typeof fieldErrors]) {
            errorMessages += `${key}: ${fieldErrors[key as keyof typeof fieldErrors]!.join(', ')}; `;
          }
      }
      return {
        status: 'error',
        message: errorMessages,
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
        assignee: data.assignee === UNASSIGNED_FORM_VALUE ? undefined : data.assignee,
        updatedAt: new Date().toISOString(),
      };
      issuesDB[issueIndex] = updatedIssue;
      
      revalidatePath('/'); 
      return { status: 'success', message: 'Issue updated successfully.', issue: updatedIssue };
    } catch (error)
     {
      console.error('Error updating issue:', error);
      return { status: 'error', message: 'Failed to update issue.' };
    }
  }

// ---- Create Issue Direct Action ----
export interface CreateIssueDirectActionState {
  status: 'idle' | 'success' | 'error';
  message: string;
  newIssueId?: string;
}

const createIssueDirectSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  status: z.custom<IssueStatus>((val) => issueStatuses.includes(val as IssueStatus), "Invalid status value"),
  priority: z.custom<IssuePriority>((val) => issuePriorities.includes(val as IssuePriority), "Invalid priority value"),
  assignee: z.string().optional(), // Will be name, UNASSIGNED_FORM_VALUE, or empty string if not selected
});

export async function createIssueDirectAction(
  prevState: CreateIssueDirectActionState,
  formData: FormData
): Promise<CreateIssueDirectActionState> {
  const rawData = {
    title: formData.get('title'),
    status: formData.get('status'),
    priority: formData.get('priority'),
    assignee: formData.get('assignee'),
  };

  const validatedFields = createIssueDirectSchema.safeParse(rawData);

  if (!validatedFields.success) {
    let errorMessages = "Validation failed: ";
    const fieldErrors = validatedFields.error.flatten().fieldErrors;
    for (const key in fieldErrors) {
        if (fieldErrors[key as keyof typeof fieldErrors]) {
          errorMessages += `${key}: ${fieldErrors[key as keyof typeof fieldErrors]!.join(', ')}; `;
        }
    }
    return {
      status: 'error',
      message: errorMessages.trim().slice(0, -1), // Remove trailing semicolon
    };
  }

  const data = validatedFields.data;

  try {
    const newIssueId = generateNewIssueId(issuesDB);
    const newIssue: Issue = {
      id: newIssueId,
      title: data.title,
      description: '', // Default to empty description for direct form
      status: data.status,
      priority: data.priority,
      assignee: (data.assignee === UNASSIGNED_FORM_VALUE || data.assignee === '') ? undefined : data.assignee,
      reporter: 'Manual Form Entry', 
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      labels: [],
    };

    issuesDB.unshift(newIssue);
    revalidatePath('/');

    return {
      status: 'success',
      message: `New issue ${newIssueId}: "${newIssue.title}" created directly.`,
      newIssueId: newIssueId,
    };
  } catch (error) {
    console.error('Error creating issue directly:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create issue directly.';
    return {
      status: 'error',
      message: errorMessage,
    };
  }
}


// Function to get current issues (simulates fetching from DB/Sheets)
export async function getIssues(): Promise<Issue[]> {
    // In a real app, fetch from Google Sheets or database
    return Promise.resolve(issuesDB);
}

// ---- Delete Issue Action ----
export interface DeleteIssueActionState {
  status: 'idle' | 'success' | 'error';
  message: string;
}

const deleteIssueSchema = z.object({
  issueId: z.string().min(1, 'Issue ID is required for deletion.'),
});

export async function deleteIssueAction(
  prevState: DeleteIssueActionState,
  formData: FormData
): Promise<DeleteIssueActionState> {
  const validatedFields = deleteIssueSchema.safeParse({
    issueId: formData.get('issueId'),
  });

  if (!validatedFields.success) {
    return {
      status: 'error',
      message: validatedFields.error.flatten().fieldErrors.issueId?.[0] || 'Invalid input for deletion.',
    };
  }

  const { issueId } = validatedFields.data;

  try {
    const issueIndex = issuesDB.findIndex(issue => issue.id === issueId);
    if (issueIndex === -1) {
      return { status: 'error', message: `Issue ${issueId} not found.` };
    }

    issuesDB.splice(issueIndex, 1); 
    revalidatePath('/'); 

    return { status: 'success', message: `Issue ${issueId} deleted successfully.` };
  } catch (error) {
    console.error('Error deleting issue:', error);
    return { status: 'error', message: 'Failed to delete issue. Please try again.' };
  }
}
