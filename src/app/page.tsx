
'use client';

import * as React from 'react';
import { SheetFlowHeader } from '@/components/sheetflow-header';
import { IssueCommandBar } from '@/components/issues/issue-command-bar';
import { IssueList } from '@/components/issues/issue-list';
import { IssueEditDialog } from '@/components/issues/issue-edit-dialog';
import { CreateIssueForm } from '@/components/issues/create-issue-form';
import { ManageAssigneesCard } from '@/components/assignees/manage-assignees-card';
import { IssueDetailsDialog } from '@/components/issues/issue-details-dialog'; // New import
import type { Issue } from '@/lib/types';
import { getIssues, deleteIssueAction, type DeleteIssueActionState, getAssignees } from '@/lib/actions';
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
  const [assignees, setAssignees] = React.useState<string[]>([]);
  const [selectedIssueForEdit, setSelectedIssueForEdit] = React.useState<Issue | null>(null);
  const [selectedIssueForDetails, setSelectedIssueForDetails] = React.useState<Issue | null>(null); // New state
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = React.useState(false); // New state
  const [isLoadingIssues, setIsLoadingIssues] = React.useState(true);
  const [isLoadingAssignees, setIsLoadingAssignees] = React.useState(true);
  const [issueToDeleteId, setIssueToDeleteId] = React.useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  
  const { toast } = useToast();
  const [deleteState, deleteFormAction] = React.useActionState(deleteIssueAction, initialDeleteState);

  const fetchAndSetIssues = React.useCallback(async () => {
    setIsLoadingIssues(true);
    try {
      const fetchedIssues = await getIssues();
      setIssues(fetchedIssues);
    } catch (error) {
      console.error("Failed to fetch issues:", error);
      toast({ title: "Error", description: "Failed to fetch issues.", variant: "destructive" });
    } finally {
      setIsLoadingIssues(false);
    }
  }, [toast]);

  const fetchAndSetAssignees = React.useCallback(async () => {
    setIsLoadingAssignees(true);
    try {
      const fetchedAssignees = await getAssignees();
      setAssignees(fetchedAssignees);
    } catch (error) {
      console.error("Failed to fetch assignees:", error);
      toast({ title: "Error", description: "Failed to fetch assignees.", variant: "destructive" });
    } finally {
      setIsLoadingAssignees(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchAndSetIssues();
    fetchAndSetAssignees();
  }, [fetchAndSetIssues, fetchAndSetAssignees]);

  React.useEffect(() => {
    if (deleteState.status === 'success') {
      toast({ title: "Success", description: deleteState.message });
      fetchAndSetIssues(); 
      setIsDeleteDialogOpen(false);
      setIssueToDeleteId(null);
    } else if (deleteState.status === 'error') {
      toast({ title: "Error", description: deleteState.message, variant: "destructive" });
    }
  }, [deleteState, toast, fetchAndSetIssues]);

  const handleEditIssue = (issue: Issue) => {
    setSelectedIssueForEdit(issue);
    setIsEditDialogOpen(true);
  };
  
  const handleViewIssueDetails = (issue: Issue) => {
    setSelectedIssueForDetails(issue);
    setIsDetailsDialogOpen(true);
  };

  const handleEditDialogClose = () => {
    setIsEditDialogOpen(false);
    setSelectedIssueForEdit(null);
  };
  
  const handleDetailsDialogClose = () => {
    setIsDetailsDialogOpen(false);
    setSelectedIssueForDetails(null);
  };

  const handleIssueUpdatedOrCreated = React.useCallback(() => {
    fetchAndSetIssues(); 
  }, [fetchAndSetIssues]);
  
  const handleCommandProcessed = React.useCallback(() => {
    fetchAndSetIssues();
  },[fetchAndSetIssues]);

  const handleAssigneesUpdated = React.useCallback(() => {
    fetchAndSetAssignees();
  }, [fetchAndSetAssignees]);

  const handleOpenDeleteDialog = (id: string) => {
    setIssueToDeleteId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setIssueToDeleteId(null);
    setIsDeleteDialogOpen(false);
  };

  const isLoading = isLoadingIssues || isLoadingAssignees;

  return (
    <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <SheetFlowHeader />
      <main className="mt-8 space-y-8">
        <IssueCommandBar onCommandProcessed={handleCommandProcessed} />
        
        {isLoading ? ( // Combined loading state
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="md:col-span-2"><Skeleton className="h-96 w-full" /></div>
             <Skeleton className="h-48 w-full" />
           </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <CreateIssueForm 
                onIssueCreated={handleIssueUpdatedOrCreated} 
                assignees={assignees} 
              />
            </div>
            <ManageAssigneesCard 
              initialAssignees={assignees} 
              onAssigneesUpdated={handleAssigneesUpdated} 
            />
          </div>
        )}
        
        {isLoadingIssues ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-1/3" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <IssueList 
            issues={issues} 
            onEditIssue={handleEditIssue} 
            onDeleteIssue={handleOpenDeleteDialog}
            onViewIssueDetails={handleViewIssueDetails} 
          />
        )}
      </main>

      {selectedIssueForEdit && (
        <IssueEditDialog
          issue={selectedIssueForEdit}
          isOpen={isEditDialogOpen}
          onOpenChange={handleEditDialogClose}
          onIssueUpdated={handleIssueUpdatedOrCreated}
          assignees={assignees}
        />
      )}

      {selectedIssueForDetails && (
        <IssueDetailsDialog
          issue={selectedIssueForDetails}
          isOpen={isDetailsDialogOpen}
          onOpenChange={handleDetailsDialogClose}
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
