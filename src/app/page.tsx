
'use client';

import * as React from 'react';
import { SheetFlowHeader } from '@/components/sheetflow-header';
import { IssueCommandBar } from '@/components/issues/issue-command-bar';
import { IssueList } from '@/components/issues/issue-list';
import { IssueEditDialog } from '@/components/issues/issue-edit-dialog';
import { CreateIssueForm } from '@/components/issues/create-issue-form';
import type { Issue } from '@/lib/types';
import { getIssues, deleteIssueAction, type DeleteIssueActionState } from '@/lib/actions'; // Server action to fetch issues
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

const initialDeleteState: DeleteIssueActionState = {
  status: 'idle',
  message: '',
};

export default function HomePage() {
  const [issues, setIssues] = React.useState<Issue[]>([]);
  const [selectedIssue, setSelectedIssue] = React.useState<Issue | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [issueToDeleteId, setIssueToDeleteId] = React.useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  
  const { toast } = useToast();
  const [deleteState, deleteFormAction] = React.useActionState(deleteIssueAction, initialDeleteState);

  const fetchAndSetIssues = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedIssues = await getIssues();
      setIssues(fetchedIssues);
    } catch (error) {
      console.error("Failed to fetch issues:", error);
      toast({ title: "Error", description: "Failed to fetch issues.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchAndSetIssues();
  }, [fetchAndSetIssues]);

  React.useEffect(() => {
    if (deleteState.status === 'success') {
      toast({ title: "Success", description: deleteState.message });
      fetchAndSetIssues(); // Refresh list
      setIsDeleteDialogOpen(false); // Close dialog
      setIssueToDeleteId(null);
    } else if (deleteState.status === 'error') {
      toast({ title: "Error", description: deleteState.message, variant: "destructive" });
      // Optionally, close dialog on error too, or leave it open for user to see context / retry
      // setIsDeleteDialogOpen(false); 
    }
  }, [deleteState, toast, fetchAndSetIssues]);

  const handleEditIssue = (issue: Issue) => {
    setSelectedIssue(issue);
    setIsEditDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsEditDialogOpen(false);
    setSelectedIssue(null);
  };

  const handleIssueUpdatedOrCreated = React.useCallback(() => {
    fetchAndSetIssues(); 
  }, [fetchAndSetIssues]);
  
  const handleCommandProcessed = React.useCallback((updatedIssueId?: string) => {
    fetchAndSetIssues();
  },[fetchAndSetIssues]);

  const handleOpenDeleteDialog = (id: string) => {
    setIssueToDeleteId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setIssueToDeleteId(null);
    setIsDeleteDialogOpen(false);
  };

  return (
    <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <SheetFlowHeader />
      <main className="mt-8 space-y-8">
        <IssueCommandBar onCommandProcessed={handleCommandProcessed} />
        <CreateIssueForm onIssueCreated={handleIssueUpdatedOrCreated} />
        
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-1/3" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <IssueList issues={issues} onEditIssue={handleEditIssue} onDeleteIssue={handleOpenDeleteDialog} />
        )}
      </main>
      {selectedIssue && (
        <IssueEditDialog
          issue={selectedIssue}
          isOpen={isEditDialogOpen}
          onOpenChange={handleDialogClose}
          onIssueUpdated={handleIssueUpdatedOrCreated}
        />
      )}
      {isDeleteDialogOpen && issueToDeleteId && (
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the issue
                <span className="font-semibold"> {issueToDeleteId}</span>.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleCloseDeleteDialog}>Cancel</AlertDialogCancel>
              <form action={deleteFormAction}>
                <input type="hidden" name="issueId" value={issueToDeleteId} />
                <Button type="submit" variant="destructive">Delete</Button>
              </form>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
