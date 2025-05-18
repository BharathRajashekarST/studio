
export type IssueStatus = "To Do" | "In Progress" | "Done" | "Backlog" | "Cancelled";
export const issueStatuses: IssueStatus[] = ["To Do", "In Progress", "Done", "Backlog", "Cancelled"];

export type IssuePriority = "Low" | "Medium" | "High" | "Urgent";
export const issuePriorities: IssuePriority[] = ["Low", "Medium", "High", "Urgent"];

export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OTHER' | '';
export const apiMethods: ApiMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OTHER'];

export interface IssueDescription {
  apiName?: string;
  method?: ApiMethod;
  payload?: string; // For JSON/text
  response?: string; // For JSON/text
  responseCode?: number;
  imageDataUri?: string; // To store base64 image data
  generalNotes?: string; // For general text, or AI generated description
}

export interface Issue {
  id: string;
  title: string;
  description: IssueDescription; // Changed from string
  status: IssueStatus;
  priority: IssuePriority;
  assignee?: string;
  reporter?: string;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  labels?: string[];
}
