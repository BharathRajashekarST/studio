
'use client';

import * as React from 'react';
import { useFormStatus } from 'react-dom';
import { useActionState } from 'react'; // Changed from 'react-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { addAssigneeAction, deleteAssigneeAction, type AddAssigneeActionState, type DeleteAssigneeActionState } from '@/lib/actions';
import { Trash2, UserPlus, Users } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ManageAssigneesCardProps {
  initialAssignees: string[];
  onAssigneesUpdated: () => void;
}

const initialAddState: AddAssigneeActionState = { status: 'idle', message: '' };
const initialDeleteState: DeleteAssigneeActionState = { status: 'idle', message: '' };

function AddSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" aria-disabled={pending} disabled={pending} size="sm">
      {pending ? 'Adding...' : <UserPlus className="mr-2 h-4 w-4" />} Add
    </Button>
  );
}

function DeleteSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="ghost" size="icon" aria-disabled={pending} disabled={pending} className="h-8 w-8">
      {pending ? <Users className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-destructive" />}
    </Button>
  );
}

export function ManageAssigneesCard({ initialAssignees, onAssigneesUpdated }: ManageAssigneesCardProps) {
  const [newAssigneeName, setNewAssigneeName] = React.useState('');
  const { toast } = useToast();
  
  const [addState, addFormAction] = useActionState(addAssigneeAction, initialAddState);
  const [deleteState, deleteFormAction] = useActionState(deleteAssigneeAction, initialDeleteState); // One action for all deletes

  const addFormRef = React.useRef<HTMLFormElement>(null);

  React.useEffect(() => {
    if (addState.status === 'success') {
      toast({ title: 'Success', description: addState.message });
      setNewAssigneeName('');
      addFormRef.current?.reset();
      onAssigneesUpdated();
    } else if (addState.status === 'error') {
      toast({ title: 'Error', description: addState.message, variant: 'destructive' });
    }
  }, [addState, toast, onAssigneesUpdated]);

  React.useEffect(() => {
    // This effect handles toasts for delete operations.
    // Since deleteFormAction is shared, we only show toast if a message is present (success or error).
    if (deleteState.message) {
        if (deleteState.status === 'success') {
            toast({ title: 'Success', description: deleteState.message });
            onAssigneesUpdated();
        } else if (deleteState.status === 'error') {
            toast({ title: 'Error', description: deleteState.message, variant: 'destructive' });
        }
    }
  }, [deleteState, toast, onAssigneesUpdated]);


  return (
    <Card className="shadow-lg h-full">
      <CardHeader>
        <CardTitle className="flex items-center text-xl">
          <Users className="mr-2 h-6 w-6 text-primary" /> Manage Assignees
        </CardTitle>
        <CardDescription>Add or remove assignees from the list.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form action={addFormAction} ref={addFormRef} className="space-y-3">
          <div>
            <Label htmlFor="assigneeName" className="text-card-foreground">New Assignee Name</Label>
            <div className="flex items-center gap-2 mt-1">
              <Input
                id="assigneeName"
                name="assigneeName"
                value={newAssigneeName}
                onChange={(e) => setNewAssigneeName(e.target.value)}
                placeholder="Enter name"
                className="bg-background text-foreground flex-grow"
                required
              />
              <AddSubmitButton />
            </div>
          </div>
        </form>

        <div className="space-y-2">
          <h4 className="text-md font-medium text-card-foreground">Current Assignees:</h4>
          {initialAssignees.length > 0 ? (
            <ScrollArea className="h-[150px] rounded-md border p-2 bg-muted/30">
              <ul className="space-y-1">
                {initialAssignees.map((assignee) => (
                  <li key={assignee} className="flex items-center justify-between p-1.5 rounded hover:bg-muted/50">
                    <span className="text-sm text-foreground">{assignee}</span>
                    <form action={deleteFormAction}>
                      <input type="hidden" name="assigneeName" value={assignee} />
                      <DeleteSubmitButton />
                    </form>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          ) : (
            <p className="text-sm text-muted-foreground">No assignees yet. Add one above.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
