
'use client';

import * as React from 'react';
import { useFormStatus } from 'react-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { issueStatuses, issuePriorities, apiMethods, type IssueStatus, type IssuePriority, type ApiMethod, type IssueDescription } from '@/lib/types';
import { createIssueDirectAction, type CreateIssueDirectActionState } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface CreateIssueFormProps {
  onIssueCreated?: (newIssueId?: string) => void;
  assignees: string[];
}

const initialState: CreateIssueDirectActionState = {
  status: 'idle',
  message: '',
};

const UNASSIGNED_SELECT_VALUE = "_SELECT_UNASSIGNED_";
const API_METHOD_NA_VALUE = "_API_METHOD_NA_"; 

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
  const fileInputRef = React.useRef<HTMLInputElement>(null); // For the image input inside the dialog

  const [isApiDetailsDialogOpen, setIsApiDetailsDialogOpen] = React.useState(false);
  const [currentApiDetails, setCurrentApiDetails] = React.useState<IssueDescription>({
    apiName: '',
    method: API_METHOD_NA_VALUE as ApiMethod, // Cast because "" is a valid ApiMethod
    payload: '',
    response: '',
    responseCode: undefined,
    imageDataUri: undefined,
    generalNotes: '', // Will be handled by its own Textarea directly in the form
  });
  
  React.useEffect(() => {
    if (state.status === 'success') {
      toast({
        title: "Issue Created",
        description: state.message,
      });
      handleReset(); // Reset the form and dialog state
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

  const handleImageChangeInDialog = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCurrentApiDetails(prev => ({ ...prev, imageDataUri: e.target?.result as string }));
      };
      reader.readAsDataURL(file);
    } else {
      setCurrentApiDetails(prev => ({ ...prev, imageDataUri: undefined }));
    }
  };
  
  const handleReset = () => {
    formRef.current?.reset(); // Resets native form elements including generalNotes Textarea
    setCurrentApiDetails({ // Reset API details state
      apiName: '',
      method: API_METHOD_NA_VALUE as ApiMethod,
      payload: '',
      response: '',
      responseCode: undefined,
      imageDataUri: undefined,
      generalNotes: '', 
    });
    if (fileInputRef.current) { // Clear file input in dialog
        fileInputRef.current.value = "";
    }
    setIsApiDetailsDialogOpen(false);
  };


  return (
    <div className="p-6 border rounded-lg shadow-lg bg-card"> {/* Removed h-full */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-card-foreground">Create New Issue</h3>
        <Button variant="outline" size="sm" onClick={handleReset}>Reset Form</Button>
      </div>
      <form action={formAction} ref={formRef} className="space-y-6">
        {/* Hidden inputs for API details, values come from currentApiDetails state */}
        <input type="hidden" name="description_apiName" value={currentApiDetails.apiName || ''} />
        <input type="hidden" name="description_method" value={currentApiDetails.method === API_METHOD_NA_VALUE ? '' : currentApiDetails.method || ''} />
        <input type="hidden" name="description_payload" value={currentApiDetails.payload || ''} />
        <input type="hidden" name="description_response" value={currentApiDetails.response || ''} />
        <input type="hidden" name="description_responseCode" value={currentApiDetails.responseCode?.toString() || ''} />
        <input type="hidden" name="description_imageDataUri" value={currentApiDetails.imageDataUri || ''} />
        
        {/* Main form content area - no outer ScrollArea here, let content define height */}
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
          
          <Button type="button" variant="outline" onClick={() => setIsApiDetailsDialogOpen(true)} className="w-full md:w-auto">
            Manage API Details
          </Button>
          
          <div className="space-y-2">
            <Label htmlFor="form-desc-generalNotes">General Notes</Label>
            <Textarea id="form-desc-generalNotes" name="description_generalNotes" placeholder="Additional details or comments..." rows={3} className="bg-background text-foreground"/>
          </div>
        </div>
        
        <div className="pt-4 border-t">
          <SubmitButton />
        </div>
      </form>

      {/* API Details Dialog */}
      <Dialog open={isApiDetailsDialogOpen} onOpenChange={setIsApiDetailsDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>API Details</DialogTitle>
            <DialogDescription>Add or edit the API specific details for this issue.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] p-1 pr-3 -mr-3"> {/* Added negative margin to compensate for padding */}
            <div className="space-y-4 py-4 pr-1"> {/* Added pr-1 to prevent scrollbar overlap */}
              <div className="space-y-2">
                <Label htmlFor="dialog-desc-apiName">API Name/Endpoint</Label>
                <Input id="dialog-desc-apiName" value={currentApiDetails.apiName || ''} onChange={(e) => setCurrentApiDetails(prev => ({...prev, apiName: e.target.value}))} placeholder="/users/{id}" className="bg-background text-foreground"/>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dialog-desc-method">Method</Label>
                  <Select 
                    value={currentApiDetails.method || API_METHOD_NA_VALUE} 
                    onValueChange={(value) => setCurrentApiDetails(prev => ({...prev, method: value as ApiMethod | typeof API_METHOD_NA_VALUE}))}
                  >
                    <SelectTrigger id="dialog-desc-method" className="bg-background text-foreground"><SelectValue placeholder="Select API method" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={API_METHOD_NA_VALUE}>N/A</SelectItem>
                      {apiMethods.map((m) => (<SelectItem key={m} value={m}>{m}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dialog-desc-responseCode">Response Code</Label>
                  <Input id="dialog-desc-responseCode" type="number" value={currentApiDetails.responseCode || ''} onChange={(e) => setCurrentApiDetails(prev => ({...prev, responseCode: e.target.value ? parseInt(e.target.value) : undefined}))} placeholder="e.g., 200, 404" className="bg-background text-foreground"/>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dialog-desc-payload">Payload (JSON, XML, etc.)</Label>
                <Textarea id="dialog-desc-payload" value={currentApiDetails.payload || ''} onChange={(e) => setCurrentApiDetails(prev => ({...prev, payload: e.target.value}))} placeholder='{ "key": "value" }' rows={3} className="bg-background text-foreground font-mono text-xs"/>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dialog-desc-response">Response (JSON, XML, etc.)</Label>
                <Textarea id="dialog-desc-response" value={currentApiDetails.response || ''} onChange={(e) => setCurrentApiDetails(prev => ({...prev, response: e.target.value}))} placeholder='{ "data": [...] }' rows={3} className="bg-background text-foreground font-mono text-xs"/>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dialog-desc-image">Attach Image</Label>
                <Input id="dialog-desc-image" type="file" accept="image/*" onChange={handleImageChangeInDialog} ref={fileInputRef} className="bg-background text-foreground file:text-primary file:font-medium"/>
                {currentApiDetails.imageDataUri && <img data-ai-hint="placeholder image" src={currentApiDetails.imageDataUri} alt="Preview" className="mt-2 max-h-40 rounded border"/>}
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="pt-4 border-t">
            <Button type="button" variant="default" onClick={() => setIsApiDetailsDialogOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

