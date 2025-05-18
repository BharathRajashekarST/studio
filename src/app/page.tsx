'use client';

import * as React from 'react';
import { SheetFlowHeader } from '@/components/sheetflow-header';
import { IssueCommandBar } from '@/components/issues/issue-command-bar';
import { IssueList } from '@/components/issues/issue-list';
import { IssueEditDialog } from '@/components/issues/issue-edit-dialog';
import type { Issue } from '@/lib/types';
import { getIssues } from '@/lib/actions'; // Server action to fetch issues
import { Skeleton } from '@/components/ui/skeleton';

export default function HomePage() {
  const [issues, setIssues] = React.useState<Issue[]>([]);
  const [selectedIssue, setSelectedIssue] = React.useState<Issue | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchAndSetIssues = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedIssues = await getIssues();
      setIssues(fetchedIssues);
    } catch (error) {
      console.error("Failed to fetch issues:", error);
      // Optionally, show a toast message for the error
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchAndSetIssues();
  }, [fetchAndSetIssues]);

  const handleEditIssue = (issue: Issue) => {
    setSelectedIssue(issue);
    setIsEditDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsEditDialogOpen(false);
    setSelectedIssue(null);
  };

  const handleIssueUpdated = () => {
    // Refetch issues to get the latest data after an update
    fetchAndSetIssues(); 
  };
  
  const handleCommandProcessed = (updatedIssueId?: string) => {
    if (updatedIssueId) {
       // If a specific issue was updated by the command, refresh the list
      fetchAndSetIssues();
    }
    // Potentially handle other outcomes of command processing here
  };


  return (
    <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <SheetFlowHeader />
      <main className="mt-8 space-y-8">
        <IssueCommandBar onCommandProcessed={handleCommandProcessed} />
        
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-1/3" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <IssueList issues={issues} onEditIssue={handleEditIssue} />
        )}
      </main>
      {selectedIssue && (
        <IssueEditDialog
          issue={selectedIssue}
          isOpen={isEditDialogOpen}
          onOpenChange={handleDialogClose}
          onIssueUpdated={handleIssueUpdated}
        />
      )}
    </div>
  );
}
