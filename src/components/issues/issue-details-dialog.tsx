
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import type { Issue, IssueDescription } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface IssueDetailsDialogProps {
  issue: Issue | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const DetailItem: React.FC<{ label: string; value?: string | number | null; children?: React.ReactNode; className?: string }> = ({
  label,
  value,
  children,
  className,
}) => {
  if (!children && (value === undefined || value === null || value === '')) return null;
  return (
    <div className={`mb-3 ${className}`}>
      <Label className="text-xs font-semibold text-muted-foreground">{label}</Label>
      {children ? (
        <div className="text-sm text-foreground mt-0.5">{children}</div>
      ) : (
        <p className="text-sm text-foreground mt-0.5 break-words">{String(value)}</p>
      )}
    </div>
  );
};


const CodeBlock: React.FC<{ content?: string | null, lang?: string }> = ({ content, lang }) => {
  if (!content) return <p className="text-sm text-muted-foreground italic mt-0.5">Not provided</p>;
  return (
    <pre className="mt-1 p-2 bg-muted/50 rounded-md text-xs text-foreground overflow-x-auto max-h-40">
      <code>{content}</code>
    </pre>
  );
};


export function IssueDetailsDialog({ issue, isOpen, onOpenChange }: IssueDetailsDialogProps) {
  if (!issue) return null;

  const { title, id, status, priority, assignee, reporter, createdAt, updatedAt, description } = issue;
  const desc = description || ({} as IssueDescription); // Ensure desc is an object

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-card shadow-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            Issue Details: <Badge variant="outline" className="ml-2 text-base">{id}</Badge>
          </DialogTitle>
          <DialogDescription>{title}</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] p-1 pr-4 my-4">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
              <DetailItem label="Status">
                <Badge variant={status === 'Done' ? 'default' : 'secondary'} className="capitalize">{status}</Badge>
              </DetailItem>
              <DetailItem label="Priority">
                <Badge variant={priority === 'Urgent' || priority === 'High' ? 'destructive' : 'outline'} className="capitalize">{priority}</Badge>
              </DetailItem>
              <DetailItem label="Assignee" value={assignee || 'Unassigned'} />
              <DetailItem label="Reporter" value={reporter || 'N/A'} />
              <DetailItem label="Created At" value={new Date(createdAt).toLocaleString()} />
              <DetailItem label="Last Updated" value={new Date(updatedAt).toLocaleString()} />
            </div>

            <Separator className="my-4" />
            <h4 className="text-lg font-semibold text-card-foreground">Description Details</h4>
            
            <DetailItem label="API Name / Endpoint" value={desc.apiName} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                <DetailItem label="Method" value={desc.method} />
                <DetailItem label="Response Code" value={desc.responseCode} />
            </div>
            
            <DetailItem label="Payload">
                <CodeBlock content={desc.payload} />
            </DetailItem>
            <DetailItem label="Response">
                <CodeBlock content={desc.response} />
            </DetailItem>

            {desc.imageDataUri && (
              <DetailItem label="Attached Image">
                <img data-ai-hint="placeholder image" src={desc.imageDataUri} alt="Attached visual" className="mt-1 max-w-full h-auto rounded border" style={{maxHeight: '300px'}}/>
              </DetailItem>
            )}
            
            <DetailItem label="General Notes">
              {desc.generalNotes ? <p className="text-sm text-foreground mt-0.5 whitespace-pre-wrap">{desc.generalNotes}</p> : <p className="text-sm text-muted-foreground italic mt-0.5">No general notes provided.</p>}
            </DetailItem>

          </div>
        </ScrollArea>
        <DialogFooter className="pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
