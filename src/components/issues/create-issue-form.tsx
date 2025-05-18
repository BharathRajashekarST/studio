
// src/components/issues/create-issue-form.tsx
'use client';

import * as React from 'react';
import { useFormStatus } from 'react-dom';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { issueStatuses, issuePriorities, type IssueStatus, type IssuePriority } from '@/lib/types';
import { assignees as mockAssignees } from '@/lib/mock-data';
import { createIssueDirectAction, type CreateIssueDirectActionState } from '@/lib/actions'; // Updated action
import { useToast } from '@/hooks/use-toast';

interface CreateIssueFormProps {
  onIssueCreated?: (newIssueId?: string) => void;
}

const initialState: CreateIssueDirectActionState = {
  status: 'idle',
  message: '',
};

// Special value for the "Unassigned" option in the Select component
const UNASSIGNED_SELECT_VALUE = "_SELECT_UNASSIGNED_";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" aria-disabled={pending} disabled={pending} className="w-full md:w-auto">
      {pending ? 'Creating...' : 'Create Issue'}
    </Button>
  );
}

export function CreateIssueForm({ onIssueCreated }: CreateIssueFormProps) {
  const [title, setTitle] = React.useState('');
  const [currentAssignee, setCurrentAssignee] = React.useState<string>(''); 
  const [currentStatus, setCurrentStatus] = React.useState<IssueStatus>('To Do');
  const [currentPriority, setCurrentPriority] = React.useState<IssuePriority>('Medium');
  
  const [state, formAction] = React.useActionState(createIssueDirectAction, initialState);
  const { toast } = useToast();
  const formRef = React.useRef<HTMLFormElement>(null);

  React.useEffect(() => {
    if (state.status === 'success') {
      toast({
        title: "Issue Created",
        description: state.message,
      });
      setTitle('');
      setCurrentAssignee(''); 
      setCurrentStatus('To Do');
      setCurrentPriority('Medium');
      formRef.current?.reset(); 
      if (onIssueCreated && state.newIssueId) {
        onIssueCreated(state.newIssueId);
      }
    } else if (state.status === 'error') {
      toast({
        title: "Error Creating Issue",
        description: state.message,
        variant: 'destructive',
      });
    }
  }, [state, toast, onIssueCreated]);

  return (
    <div className="mt-8 p-6 border rounded-lg shadow-lg bg-card">
      <h3 className="text-xl font-semibold mb-6 text-card-foreground">Create New Issue</h3>
      <form action={formAction} ref={formRef} className="space-y-6">
        
        <div className="space-y-2">
          <Label htmlFor="form-title" className="text-card-foreground">Title</Label>
          <Input 
            id="form-title"
            name="title" // Name for FormData
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            placeholder="Enter issue title"
            required 
            className="bg-background text-foreground"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="form-status" className="text-card-foreground">Status</Label>
            <Select name="status" value={currentStatus} onValueChange={(value: IssueStatus) => setCurrentStatus(value)}> {/* Name for FormData */}
              <SelectTrigger id="form-status" className="bg-background text-foreground">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {issueStatuses.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="form-priority" className="text-card-foreground">Priority</Label>
            <Select name="priority" value={currentPriority} onValueChange={(value: IssuePriority) => setCurrentPriority(value)}> {/* Name for FormData */}
              <SelectTrigger id="form-priority" className="bg-background text-foreground">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                {issuePriorities.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="form-assignee" className="text-card-foreground">Assignee</Label>
            <Select name="assignee" value={currentAssignee} onValueChange={setCurrentAssignee}> {/* Name for FormData */}
              <SelectTrigger id="form-assignee" className="bg-background text-foreground">
                <SelectValue placeholder="Select assignee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UNASSIGNED_SELECT_VALUE}>Unassigned</SelectItem>
                {mockAssignees.map((assigneeName) => (
                  <SelectItem key={assigneeName} value={assigneeName}>
                    {assigneeName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div>
          <SubmitButton />
        </div>
      </form>
    </div>
  );
}
