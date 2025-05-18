
import type { Issue, IssueDescription } from '@/lib/types';

const defaultDescription: IssueDescription = {
  generalNotes: 'This is a standard issue description.',
};

export const initialIssues: Issue[] = [
  {
    id: 'SF-001',
    title: 'Implement user authentication API',
    description: {
      apiName: '/auth/login',
      method: 'POST',
      payload: '{\n  "email": "user@example.com",\n  "password": "securepassword123"\n}',
      response: '{\n  "token": "jwt.token.here",\n  "userId": "12345"\n}',
      responseCode: 200,
      generalNotes: 'Users should be able to sign up and log in using email and password. Backend endpoint for login.',
      imageDataUri: 'https://placehold.co/300x200.png', // Placeholder
    },
    status: 'In Progress',
    priority: 'Urgent',
    assignee: 'Alice Wonderland',
    reporter: 'Project Lead',
    createdAt: new Date(2023, 10, 1).toISOString(),
    updatedAt: new Date(2023, 10, 5).toISOString(),
    dueDate: new Date(2023, 10, 15).toISOString(),
    labels: ['auth', 'backend', 'api'],
  },
  {
    id: 'SF-002',
    title: 'Design issue list UI',
    description: {
      generalNotes: 'Create a responsive and user-friendly UI for displaying issues. Consider filtering and sorting capabilities.',
    },
    status: 'To Do',
    priority: 'High',
    assignee: 'Bob The Builder',
    reporter: 'UX Designer',
    createdAt: new Date(2023, 10, 2).toISOString(),
    updatedAt: new Date(2023, 10, 2).toISOString(),
    dueDate: new Date(2023, 10, 20).toISOString(),
    labels: ['ui', 'frontend', 'design'],
  },
  {
    id: 'SF-003',
    title: 'Integrate Google Sheets API for reading data',
    description: {
      apiName: 'Google Sheets API v4',
      method: 'GET',
      generalNotes: 'Connect to Google Sheets to fetch initial issue data. Focus on read operations first.',
      responseCode: 200,
    },
    status: 'Backlog',
    priority: 'Medium',
    reporter: 'Project Lead',
    createdAt: new Date(2023, 10, 3).toISOString(),
    updatedAt: new Date(2023, 10, 3).toISOString(),
    labels: ['api', 'backend', 'integration'],
  },
  {
    id: 'SF-004',
    title: 'Fix layout bug on mobile devices',
    description: {
      generalNotes: 'The main content area overflows on smaller screens. Investigate CSS and responsive breakpoints.',
      imageDataUri: 'https://placehold.co/300x150.png', // Placeholder for bug screenshot
    },
    status: 'Done',
    priority: 'High',
    assignee: 'Charlie Brown',
    reporter: 'QA Tester',
    createdAt: new Date(2023, 9, 15).toISOString(),
    updatedAt: new Date(2023, 9, 20).toISOString(),
    dueDate: new Date(2023, 9, 18).toISOString(),
    labels: ['bug', 'frontend', 'mobile'],
  },
  {
    id: 'SF-005',
    title: 'Setup CI/CD pipeline',
    description: {
      generalNotes: 'Automate build, test, and deployment processes using GitHub Actions or similar.',
    },
    status: 'To Do',
    priority: 'Medium',
    assignee: 'Diana Prince',
    reporter: 'DevOps Engineer',
    createdAt: new Date(2023, 10, 8).toISOString(),
    updatedAt: new Date(2023, 10, 8).toISOString(),
    labels: ['devops', 'ci-cd'],
  },
];

export let assignees: string[] = [
  "Alice Wonderland",
  "Bob The Builder",
  "Charlie Brown",
  "Diana Prince",
  "Edward Scissorhands",
  "Fiona Gallagher"
];
