
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
import { processIssueCommandAction, type CommandActionState } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';

interface CreateIssueFormProps {
  onIssueCreated?: (updatedIssueId?: string) => void;
}

const initialState: CommandActionState = {
  status: 'idle',
  message: '',
};

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
  const [currentAssignee, setCurrentAssignee] = React.useState<string>(''); // Can be empty string for "unassigned" by default
  const [currentStatus, setCurrentStatus] = React.useState<IssueStatus>('To Do');
  const [currentPriority, setCurrentPriority] = React.useState<IssuePriority>('Medium');
  
  const [state, formAction] = React.useActionState(processIssueCommandAction, initialState);
  const { toast } = useToast();
  const formRef = React.useRef<HTMLFormElement>(null);

  const commandValue = React.useMemo(() => {
    if (!title.trim()) return ""; // Don't generate command if title is empty
    return `Create new issue: '${title.trim()}', assign to ${currentAssignee || 'unassigned'}, status ${currentStatus}, priority ${currentPriority}`;
  }, [title, currentAssignee, currentStatus, currentPriority]);

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
      formRef.current?.reset(); // Reset native form fields if any weren't controlled or for safety
      if (onIssueCreated && state.updatedIssueId) {
        onIssueCreated(state.updatedIssueId);
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
        {/* Hidden input to pass the constructed command */}
        <input type="hidden" name="command" value={commandValue} />
        
        <div className="space-y-2">
          <Label htmlFor="form-title" className="text-card-foreground">Title</Label>
          <Input 
            id="form-title" 
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
            <Select value={currentStatus} onValueChange={(value: IssueStatus) => setCurrentStatus(value)}>
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
            <Select value={currentPriority} onValueChange={(value: IssuePriority) => setCurrentPriority(value)}>
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
            <Select value={currentAssignee} onValueChange={setCurrentAssignee}>
              <SelectTrigger id="form-assignee" className="bg-background text-foreground">
                <SelectValue placeholder="Select assignee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Unassigned</SelectItem>
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

