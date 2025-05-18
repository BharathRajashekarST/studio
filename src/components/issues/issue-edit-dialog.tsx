
'use client';
import { useActionState } from 'react';
import React, { useEffect, useState, useRef } from 'react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Issue, IssuePriority, IssueStatus, ApiMethod } from '@/lib/types';
import { issueStatuses, issuePriorities, apiMethods } from '@/lib/types';
import { updateIssueAction, type UpdateIssueActionState } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Trash2 } from 'lucide-react';

interface IssueEditDialogProps {
  issue: Issue | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onIssueUpdated: () => void;
  assignees: string[]; 
}

const initialState: UpdateIssueActionState = {
  status: 'idle',
  message: '',
};

const UNASSIGNED_SELECT_VALUE = "_SELECT_UNASSIGNED_";
const API_METHOD_NA_VALUE = "_API_METHOD_NA_"; // Constant for N/A method

export function IssueEditDialog({ issue, isOpen, onOpenChange, onIssueUpdated, assignees }: IssueEditDialogProps) {
  const [state, formAction] = useActionState(updateIssueAction, initialState);
  const { toast } = useToast();
  const formRef = React.useRef<HTMLFormElement>(null);
  
  const [currentAssignee, setCurrentAssignee] = useState(issue?.assignee || UNASSIGNED_SELECT_VALUE);
  const [currentApiMethod, setCurrentApiMethod] = useState(issue?.description.method || API_METHOD_NA_VALUE);
  const [imageDataUri, setImageDataUri] = useState<string | undefined>(issue?.description.imageDataUri);
  const [clearImageFlag, setClearImageFlag] = useState<boolean>(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);


  useEffect(() => {
    if (issue) {
      setCurrentAssignee(issue.assignee || UNASSIGNED_SELECT_VALUE);
      setCurrentApiMethod(issue.description.method || API_METHOD_NA_VALUE);
      setImageDataUri(issue.description.imageDataUri);
      setClearImageFlag(false);
      if (formRef.current) {
        formRef.current.reset(); 
      }
    } else {
      setCurrentAssignee(UNASSIGNED_SELECT_VALUE);
      setCurrentApiMethod(API_METHOD_NA_VALUE);
      setImageDataUri(undefined);
      setClearImageFlag(false);
    }
  }, [issue, isOpen]); 

  useEffect(() => {
    if (state.status === 'success') {
      toast({
        title: 'Success',
        description: state.message,
      });
      onIssueUpdated(); 
      onOpenChange(false); 
    } else if (state.status === 'error') {
      toast({
        title: 'Error',
        description: state.message,
        variant: 'destructive',
      });
    }
  }, [state, toast, onOpenChange, onIssueUpdated]);

  if (!issue) return null;

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageDataUri(e.target?.result as string);
        setClearImageFlag(false); 
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearImage = () => {
    setImageDataUri(undefined);
    setClearImageFlag(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; 
    }
  };
  
  const defaultDescription = issue.description || {};

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-card shadow-xl">
        <DialogHeader>
          <DialogTitle>Edit Issue: {issue.id}</DialogTitle>
          <DialogDescription>
            Make changes to the issue details below. Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} ref={formRef}>
          <input type="hidden" name="id" value={issue.id} />
          <ScrollArea className="max-h-[70vh] p-1 pr-3">
            <div className="grid gap-4 py-4">
              {/* Core Fields */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">Title*</Label>
                <Input id="title" name="title" defaultValue={issue.title} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">Status</Label>
                <Select name="status" defaultValue={issue.status}>
                  <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                  <SelectContent>{issueStatuses.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="priority" className="text-right">Priority</Label>
                <Select name="priority" defaultValue={issue.priority}>
                  <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                  <SelectContent>{issuePriorities.map((p) => (<SelectItem key={p} value={p}>{p}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="assignee" className="text-right">Assignee</Label>
                <Select name="assignee" value={currentAssignee} onValueChange={setCurrentAssignee}>
                  <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UNASSIGNED_SELECT_VALUE}>Unassigned</SelectItem>
                    {assignees.map((an) => (<SelectItem key={an} value={an}>{an}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>

              {/* Structured Description Fields */}
              <h4 className="col-span-4 text-md font-semibold pt-3 mt-3 border-t">API Details (Optional)</h4>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-desc-apiName" className="text-right">API Name</Label>
                <Input id="edit-desc-apiName" name="description_apiName" defaultValue={defaultDescription.apiName} className="col-span-3"/>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-desc-method" className="text-right">Method</Label>
                <Select name="description_method" value={currentApiMethod} onValueChange={setCurrentApiMethod}>
                  <SelectTrigger className="col-span-3"><SelectValue placeholder="Select method"/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={API_METHOD_NA_VALUE}>N/A</SelectItem>
                    {apiMethods.map((m) => (<SelectItem key={m} value={m}>{m}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
               <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-desc-responseCode" className="text-right">Response Code</Label>
                <Input id="edit-desc-responseCode" name="description_responseCode" type="number" defaultValue={defaultDescription.responseCode} className="col-span-3"/>
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="edit-desc-payload" className="text-right pt-2">Payload</Label>
                <Textarea id="edit-desc-payload" name="description_payload" defaultValue={defaultDescription.payload} className="col-span-3 font-mono text-xs" rows={4}/>
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="edit-desc-response" className="text-right pt-2">Response</Label>
                <Textarea id="edit-desc-response" name="description_response" defaultValue={defaultDescription.response} className="col-span-3 font-mono text-xs" rows={4}/>
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="edit-desc-image" className="text-right pt-2">Image</Label>
                <div className="col-span-3 space-y-2">
                  <Input id="edit-desc-image" name="description_new_image" type="file" accept="image/*" onChange={handleImageChange} ref={fileInputRef} className="file:text-primary file:font-medium"/>
                  {imageDataUri && (
                    <div className="relative group w-fit">
                      <img data-ai-hint="placeholder image" src={imageDataUri} alt="Preview" className="mt-1 max-h-40 rounded border"/>
                      <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-70 group-hover:opacity-100" onClick={handleClearImage}>
                        <Trash2 className="h-3 w-3"/>
                      </Button>
                    </div>
                  )}
                  <input type="hidden" name="description_imageDataUri" value={imageDataUri || ""} />
                  {clearImageFlag && <input type="hidden" name="description_imageDataUri_clear" value="true" />}
                </div>
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="edit-desc-generalNotes" className="text-right pt-2">General Notes</Label>
                <Textarea id="edit-desc-generalNotes" name="description_generalNotes" defaultValue={defaultDescription.generalNotes} className="col-span-3" rows={3}/>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="default">
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
