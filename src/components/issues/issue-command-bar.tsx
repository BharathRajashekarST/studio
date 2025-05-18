
'use client';

import React, { useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Send, Terminal } from 'lucide-react';
import { processIssueCommandAction, type CommandActionState } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const initialState: CommandActionState = {
  status: 'idle',
  message: '',
};

export function IssueCommandBar({ onCommandProcessed }: { onCommandProcessed?: (updatedIssueId?: string) => void }) {
  const [state, formAction] = React.useActionState(processIssueCommandAction, initialState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === 'success') {
      toast({
        title: "Command Processed",
        description: state.message,
        variant: 'default',
      });
      if (state.interpretation) {
        console.log("Interpretation:", state.interpretation);
      }
      if(state.updatedIssueId && onCommandProcessed) {
        onCommandProcessed(state.updatedIssueId);
      }
      formRef.current?.reset();
    } else if (state.status === 'error') {
      toast({
        title: "Error",
        description: state.message,
        variant: 'destructive',
      });
    }
  }, [state, toast, onCommandProcessed]);

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-xl">
          <Terminal className="mr-2 h-6 w-6 text-primary" />
          AI Command Bar
        </CardTitle>
        <CardDescription>
          Type commands like &quot;Create new issue: Fix login button, priority High&quot;, &quot;Update status of SF-001 to Done&quot;, or &quot;Assign SF-002 to Bob The Builder&quot;.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} ref={formRef} className="space-y-4">
          <div className="flex gap-2">
            <Input
              name="command"
              placeholder="Enter your command..."
              className="flex-grow text-base"
              required
              aria-label="AI Command Input"
            />
            <Button type="submit" variant="default" size="lg" aria-label="Submit Command">
              <SubmitButtonContent />
            </Button>
          </div>
          {state.interpretation && state.status === 'success' && (
             <Alert variant="default" className="mt-4 bg-secondary/50">
                <Terminal className="h-4 w-4" />
                <AlertTitle>AI Interpretation Result</AlertTitle>
                <AlertDescription>
                    <pre className="mt-2 whitespace-pre-wrap rounded-md bg-muted p-2 text-xs font-mono">
                        {JSON.stringify(state.interpretation, null, 2)}
                    </pre>
                </AlertDescription>
            </Alert>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

function SubmitButtonContent() {
  return <Send className="h-5 w-5" />;
}
