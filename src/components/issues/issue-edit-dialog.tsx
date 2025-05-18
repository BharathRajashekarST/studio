'use client';

import { useEffect, useState } from 'react';
import { useFormState } from 'react-dom';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Issue, IssuePriority, IssueStatus } from '@/lib/types';
import { issueStatuses, issuePriorities } from '@/lib/types';
import { assignees as mockAssignees } from '@/lib/mock-data'; // Corrected import path
import { updateIssueAction, type UpdateIssueActionState } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface IssueEditDialogProps {
  issue: Issue | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onIssueUpdated: () => void;
}

const initialState: UpdateIssueActionState = {
  status: 'idle',
  message: '',
};

export function IssueEditDialog({ issue, isOpen, onOpenChange, onIssueUpdated }: IssueEditDialogProps) {
  const [state, formAction] = useFormState(updateIssueAction, initialState);
  const { toast } = useToast();
  const [currentAssignee, setCurrentAssignee] = useState(issue?.assignee || "");

  useEffect(() => {
    if (issue) {
      setCurrentAssignee(issue.assignee || "");
    }
  }, [issue]);

  useEffect(() => {
    if (state.status === 'success') {
      toast({
        title: 'Success',
        description: state.message,
      });
      onIssueUpdated(); // Callback to refresh list or data
      onOpenChange(false); // Close dialog
    } else if (state.status === 'error') {
      toast({
        title: 'Error',
        description: state.message,
        variant: 'destructive',
      });
    }
  }, [state, toast, onOpenChange, onIssueUpdated]);

  if (!issue) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px] bg-card shadow-xl">
        <DialogHeader>
          <DialogTitle>Edit Issue: {issue.id}</DialogTitle>
          <DialogDescription>
            Make changes to the issue details below. Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction}>
          <input type="hidden" name="id" value={issue.id} />
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <Input id="title" name="title" defaultValue={issue.title} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={issue.description}
                className="col-span-3"
                rows={4}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Status
              </Label>
              <Select name="status" defaultValue={issue.status}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {issueStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="priority" className="text-right">
                Priority
              </Label>
              <Select name="priority" defaultValue={issue.priority}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {issuePriorities.map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      {priority}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="assignee" className="text-right">
                Assignee
              </Label>
              <Select name="assignee" value={currentAssignee} onValueChange={setCurrentAssignee}>
                <SelectTrigger className="col-span-3">
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
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="default">
              <SubmitButtonContent />
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SubmitButtonContent() {
  // const { pending } = useFormStatus(); // Not suitable here with useFormState like this
  // For simplicity, we don't show a pending state here.
  return <>Save Changes</>;
}
