
'use client';

import * as React from 'react';
import { useFormStatus } from 'react-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { issueStatuses, issuePriorities, apiMethods, type IssueStatus, type IssuePriority, type ApiMethod } from '@/lib/types';
import { createIssueDirectAction, type CreateIssueDirectActionState } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CreateIssueFormProps {
  onIssueCreated?: (newIssueId?: string) => void;
  assignees: string[];
}

const initialState: CreateIssueDirectActionState = {
  status: 'idle',
  message: '',
};

const UNASSIGNED_SELECT_VALUE = "_SELECT_UNASSIGNED_";
const API_METHOD_NA_VALUE = "_API_METHOD_NA_"; // Constant for N/A method

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" aria-disabled={pending} disabled={pending} className="w-full md:w-auto">
      {pending ? 'Creating...' : 'Create Issue'}
    </Button>
  );
}

export function CreateIssueForm({ onIssueCreated, assignees }: CreateIssueFormProps) {
  const [state, formAction] = React.useActionState(createIssueDirectAction, initialState);
  const { toast } = useToast();
  const formRef = React.useRef<HTMLFormElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [imageDataUri, setImageDataUri] = React.useState<string | undefined>(undefined);

  React.useEffect(() => {
    if (state.status === 'success') {
      toast({
        title: "Issue Created",
        description: state.message,
      });
      formRef.current?.reset();
      setImageDataUri(undefined);
      if (fileInputRef.current) {
        fileInputRef.current.value = ""; // Clear file input
      }
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

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageDataUri(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImageDataUri(undefined);
    }
  };
  
  // Reset form handler
  const handleReset = () => {
    formRef.current?.reset();
    setImageDataUri(undefined);
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
    // Reset any local state for controlled inputs if necessary, e.g.,
    // For Select components, explicitly reset their defaultValue if it's managed by state
    // For this form, we are relying on form.reset() and uncontrolled nature primarily
  };


  return (
    <div className="p-6 border rounded-lg shadow-lg bg-card h-full">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-card-foreground">Create New Issue</h3>
        <Button variant="outline" size="sm" onClick={handleReset}>Reset Form</Button>
      </div>
      <form action={formAction} ref={formRef} className="space-y-6">
        <ScrollArea className="h-[calc(100%-120px)] pr-3"> {/* Adjust height as needed */}
          <div className="space-y-4">
            {/* Core Fields */}
            <div className="space-y-2">
              <Label htmlFor="form-title" className="text-card-foreground">Title*</Label>
              <Input id="form-title" name="title" placeholder="Enter issue title" required className="bg-background text-foreground"/>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="form-status" className="text-card-foreground">Status</Label>
                <Select name="status" defaultValue="To Do">
                  <SelectTrigger id="form-status" className="bg-background text-foreground"><SelectValue placeholder="Select status" /></SelectTrigger>
                  <SelectContent>{issueStatuses.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="form-priority" className="text-card-foreground">Priority</Label>
                <Select name="priority" defaultValue="Medium">
                  <SelectTrigger id="form-priority" className="bg-background text-foreground"><SelectValue placeholder="Select priority" /></SelectTrigger>
                  <SelectContent>{issuePriorities.map((p) => (<SelectItem key={p} value={p}>{p}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="form-assignee" className="text-card-foreground">Assignee</Label>
                <Select name="assignee" defaultValue={UNASSIGNED_SELECT_VALUE}>
                  <SelectTrigger id="form-assignee" className="bg-background text-foreground"><SelectValue placeholder="Select assignee" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UNASSIGNED_SELECT_VALUE}>Unassigned</SelectItem>
                    {assignees.map((assigneeName) => (<SelectItem key={assigneeName} value={assigneeName}>{assigneeName}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Structured Description Fields */}
            <h4 className="text-md font-semibold pt-2 text-card-foreground border-t mt-4">API Details (Optional)</h4>
            <div className="space-y-2">
              <Label htmlFor="form-desc-apiName">API Name/Endpoint</Label>
              <Input id="form-desc-apiName" name="description_apiName" placeholder="/users/{id}" className="bg-background text-foreground"/>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="form-desc-method">Method</Label>
                <Select name="description_method" defaultValue={API_METHOD_NA_VALUE}>
                  <SelectTrigger id="form-desc-method" className="bg-background text-foreground"><SelectValue placeholder="Select API method" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={API_METHOD_NA_VALUE}>N/A</SelectItem>
                    {apiMethods.map((m) => (<SelectItem key={m} value={m}>{m}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="form-desc-responseCode">Response Code</Label>
                <Input id="form-desc-responseCode" name="description_responseCode" type="number" placeholder="e.g., 200, 404" className="bg-background text-foreground"/>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="form-desc-payload">Payload (JSON, XML, etc.)</Label>
              <Textarea id="form-desc-payload" name="description_payload" placeholder='{ "key": "value" }' rows={3} className="bg-background text-foreground font-mono text-xs"/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="form-desc-response">Response (JSON, XML, etc.)</Label>
              <Textarea id="form-desc-response" name="description_response" placeholder='{ "data": [...] }' rows={3} className="bg-background text-foreground font-mono text-xs"/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="form-desc-image">Attach Image</Label>
              <Input id="form-desc-image" type="file" accept="image/*" onChange={handleImageChange} ref={fileInputRef} className="bg-background text-foreground file:text-primary file:font-medium"/>
              {imageDataUri && <img data-ai-hint="placeholder image" src={imageDataUri} alt="Preview" className="mt-2 max-h-40 rounded border"/>}
              <input type="hidden" name="description_imageDataUri" value={imageDataUri || ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="form-desc-generalNotes">General Notes</Label>
              <Textarea id="form-desc-generalNotes" name="description_generalNotes" placeholder="Additional details or comments..." rows={3} className="bg-background text-foreground"/>
            </div>
          </div>
        </ScrollArea>
        <div className="pt-4 border-t">
          <SubmitButton />
        </div>
      </form>
    </div>
  );
}
