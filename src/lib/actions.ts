
'use server';

import { z } from 'zod';
import { interpretIssueCommand, type InterpretIssueCommandOutput } from '@/ai/flows/interpret-issue-command';
import type { Issue, IssuePriority, IssueStatus, IssueDescription, ApiMethod } from '@/lib/types';
import { issuePriorities, issueStatuses, apiMethods } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { assignees as assigneesDB, initialIssues } from '@/lib/mock-data';

let issuesDB: Issue[] = initialIssues;

export interface CommandActionState {
  status: 'idle' | 'success' | 'error';
  message: string;
  interpretation?: InterpretIssueCommandOutput;
  updatedIssueId?: string;
}

const commandSchema = z.object({
  command: z.string().min(1, 'Command cannot be empty.'),
});

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

const UNASSIGNED_FORM_VALUE = "_SELECT_UNASSIGNED_";
const API_METHOD_NA_FORM_VALUE = "_API_METHOD_NA_";


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
        description: { 
            generalNotes: interpretation.description || '',
        },
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
      } else if (interpretation.action === 'updateIssueStatus' && interpretation.status) {
        if (!issueStatuses.includes(interpretation.status as IssueStatus)) {
            return { status: 'error', message: `Invalid status: ${interpretation.status}.`, interpretation };
        }
        issueToUpdate.status = interpretation.status as IssueStatus;
        issueToUpdate.updatedAt = new Date().toISOString();
      } else if (interpretation.action === 'updateIssuePriority' && interpretation.priority) {
         if (!issuePriorities.includes(interpretation.priority as IssuePriority)) {
            return { status: 'error', message: `Invalid priority: ${interpretation.priority}.`, interpretation };
        }
        issueToUpdate.priority = interpretation.priority as IssuePriority;
        issueToUpdate.updatedAt = new Date().toISOString();
      } else if (interpretation.action === 'updateIssueDescription' && typeof interpretation.description === 'string') {
        issueToUpdate.description.generalNotes = interpretation.description;
        issueToUpdate.updatedAt = new Date().toISOString();
      } else if (interpretation.action === 'updateIssueTitle' && interpretation.title) {
        issueToUpdate.title = interpretation.title;
        issueToUpdate.updatedAt = new Date().toISOString();
      } else {
         return { status: 'error', message: `Unknown or incomplete action for issue ${interpretation.issueId}.`, interpretation };
      }
      revalidatePath('/');
      return {
        status: 'success',
        message: `Issue ${issueToUpdate.id} updated based on command. Action: ${interpretation.action}.`,
        interpretation,
        updatedIssueId,
      };
    }

    return {
      status: 'success',
      message: 'Command interpreted. Review interpretation below. No specific database action taken as no issue ID was identified for update/assign, and it was not a create command.',
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
  status: z.custom<IssueStatus>((val) => issueStatuses.includes(val as IssueStatus), "Invalid status value"),
  priority: z.custom<IssuePriority>((val) => issuePriorities.includes(val as IssuePriority), "Invalid priority value"),
  assignee: z.string().optional(),
  description_apiName: z.string().optional(),
  description_method: z.string().optional(), // Accepts API_METHOD_NA_FORM_VALUE or actual methods
  description_payload: z.string().optional(),
  description_response: z.string().optional(),
  description_responseCode: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : parseInt(String(val), 10)),
    z.number().int().optional()
  ),
  description_imageDataUri: z.string().optional(), 
  description_imageDataUri_clear: z.string().optional(), 
  description_generalNotes: z.string().optional(),
});


export async function updateIssueAction(
    prevState: UpdateIssueActionState,
    formData: FormData
  ): Promise<UpdateIssueActionState> {
    const rawData = {
      id: formData.get('id'),
      title: formData.get('title'),
      status: formData.get('status'),
      priority: formData.get('priority'),
      assignee: formData.get('assignee'),
      description_apiName: formData.get('description_apiName'),
      description_method: formData.get('description_method'),
      description_payload: formData.get('description_payload'),
      description_response: formData.get('description_response'),
      description_responseCode: formData.get('description_responseCode'),
      description_imageDataUri: formData.get('description_imageDataUri'),
      description_imageDataUri_clear: formData.get('description_imageDataUri_clear'),
      description_generalNotes: formData.get('description_generalNotes'),
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
      
      const existingIssue = issuesDB[issueIndex];
      
      let actualApiMethod: ApiMethod | undefined = undefined;
      if (data.description_method && data.description_method !== API_METHOD_NA_FORM_VALUE) {
        actualApiMethod = data.description_method as ApiMethod;
      } else if (data.description_method === '') { // Handle if empty string is somehow passed despite NA value
         actualApiMethod = undefined; // Or treat '' as a valid ApiMethod if desired
      }


      const newDescription: IssueDescription = {
        apiName: data.description_apiName,
        method: actualApiMethod,
        payload: data.description_payload,
        response: data.description_response,
        responseCode: data.description_responseCode,
        imageDataUri: data.description_imageDataUri_clear === "true" 
                        ? undefined 
                        : (data.description_imageDataUri || existingIssue.description.imageDataUri),
        generalNotes: data.description_generalNotes,
      };

      const updatedIssue: Issue = {
        ...existingIssue,
        title: data.title,
        status: data.status,
        priority: data.priority,
        assignee: data.assignee === UNASSIGNED_FORM_VALUE ? undefined : data.assignee,
        description: newDescription,
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

export interface CreateIssueDirectActionState {
  status: 'idle' | 'success' | 'error';
  message: string;
  newIssueId?: string;
}

const createIssueDirectSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  status: z.custom<IssueStatus>((val) => issueStatuses.includes(val as IssueStatus), "Invalid status value"),
  priority: z.custom<IssuePriority>((val) => issuePriorities.includes(val as IssuePriority), "Invalid priority value"),
  assignee: z.string().optional(),
  description_apiName: z.string().optional(),
  description_method: z.string().optional(), // Accepts API_METHOD_NA_FORM_VALUE or actual methods
  description_payload: z.string().optional(),
  description_response: z.string().optional(),
  description_responseCode: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : parseInt(String(val), 10)),
    z.number().int().optional()
  ),
  description_imageDataUri: z.string().optional(),
  description_generalNotes: z.string().optional(),
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
    description_apiName: formData.get('description_apiName'),
    description_method: formData.get('description_method'),
    description_payload: formData.get('description_payload'),
    description_response: formData.get('description_response'),
    description_responseCode: formData.get('description_responseCode'),
    description_imageDataUri: formData.get('description_imageDataUri'),
    description_generalNotes: formData.get('description_generalNotes'),
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
      message: errorMessages.trim().slice(0, -1),
    };
  }

  const data = validatedFields.data;

  try {
    const newIssueId = generateNewIssueId(issuesDB);
    
    let actualApiMethod: ApiMethod | undefined = undefined;
    if (data.description_method && data.description_method !== API_METHOD_NA_FORM_VALUE) {
      actualApiMethod = data.description_method as ApiMethod;
    }
    // If description_method is API_METHOD_NA_FORM_VALUE or empty, actualApiMethod remains undefined.

    const newDescription: IssueDescription = {
      apiName: data.description_apiName,
      method: actualApiMethod,
      payload: data.description_payload,
      response: data.description_response,
      responseCode: data.description_responseCode,
      imageDataUri: data.description_imageDataUri,
      generalNotes: data.description_generalNotes,
    };

    const newIssue: Issue = {
      id: newIssueId,
      title: data.title,
      description: newDescription,
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

export async function getIssues(): Promise<Issue[]> {
    return Promise.resolve(issuesDB);
}

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

export async function getAssignees(): Promise<string[]> {
  return Promise.resolve(assigneesDB);
}

export interface AddAssigneeActionState {
  status: 'idle' | 'success' | 'error';
  message: string;
}
const addAssigneeSchema = z.object({
  assigneeName: z.string().min(1, 'Assignee name cannot be empty.').max(50, 'Assignee name too long.'),
});

export async function addAssigneeAction(
  prevState: AddAssigneeActionState,
  formData: FormData
): Promise<AddAssigneeActionState> {
  const validatedFields = addAssigneeSchema.safeParse({
    assigneeName: formData.get('assigneeName'),
  });

  if (!validatedFields.success) {
    return {
      status: 'error',
      message: validatedFields.error.flatten().fieldErrors.assigneeName?.[0] || 'Invalid assignee name.',
    };
  }
  const { assigneeName } = validatedFields.data;

  if (assigneesDB.includes(assigneeName)) {
    return { status: 'error', message: `Assignee "${assigneeName}" already exists.` };
  }
  assigneesDB.push(assigneeName);
  revalidatePath('/');
  return { status: 'success', message: `Assignee "${assigneeName}" added.` };
}

export interface DeleteAssigneeActionState {
  status: 'idle' | 'success' | 'error';
  message: string;
}
const deleteAssigneeSchema = z.object({
  assigneeName: z.string().min(1, 'Assignee name is required.'),
});

export async function deleteAssigneeAction(
  prevState: DeleteAssigneeActionState,
  formData: FormData
): Promise<DeleteAssigneeActionState> {
  const validatedFields = deleteAssigneeSchema.safeParse({
    assigneeName: formData.get('assigneeName'),
  });

  if (!validatedFields.success) {
    return {
      status: 'error',
      message: validatedFields.error.flatten().fieldErrors.assigneeName?.[0] || 'Invalid assignee name for deletion.',
    };
  }
  const { assigneeName } = validatedFields.data;
  const index = assigneesDB.indexOf(assigneeName);
  if (index === -1) {
    return { status: 'error', message: `Assignee "${assigneeName}" not found.` };
  }
  assigneesDB.splice(index, 1);
  revalidatePath('/');
  return { status: 'success', message: `Assignee "${assigneeName}" deleted.` };
}
