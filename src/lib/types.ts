export type IssueStatus = "To Do" | "In Progress" | "Done" | "Backlog" | "Cancelled";
export const issueStatuses: IssueStatus[] = ["To Do", "In Progress", "Done", "Backlog", "Cancelled"];

export type IssuePriority = "Low" | "Medium" | "High" | "Urgent";
export const issuePriorities: IssuePriority[] = ["Low", "Medium", "High", "Urgent"];

export interface Issue {
  id: string;
  title: string;
  description: string;
  status: IssueStatus;
  priority: IssuePriority;
  assignee?: string; 
  reporter?: string;
  createdAt: string; 
  updatedAt: string; 
  dueDate?: string;
  labels?: string[];
}
