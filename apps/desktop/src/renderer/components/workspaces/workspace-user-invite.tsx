import { isValidEmail } from '@colanode/core';
import { X } from 'lucide-react';
import React from 'react';

import { Button } from '@/renderer/components/ui/button';
import { Spinner } from '@/renderer/components/ui/spinner';
import { useMutation } from '@/renderer/hooks/use-mutation';
import { toast } from '@/renderer/hooks/use-toast';
import { Workspace } from '@/shared/types/workspaces';

interface WorkspaceUserInviteProps {
  workspace: Workspace;
}

export const WorkspaceUserInvite = ({
  workspace,
}: WorkspaceUserInviteProps) => {
  const { mutate, isPending } = useMutation();

  const [input, setInput] = React.useState('');
  const [emails, setEmails] = React.useState<string[]>([]);

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex flex-row items-center gap-2">
        <div>
          <p>Invite with email</p>
          <p className="text-sm text-muted-foreground">
            Write the email addresses of the people you want to invite
          </p>
        </div>
      </div>
      <div className="flex flex-row items-center gap-1">
        <div className="flex h-9 w-full flex-row gap-2 rounded-md border border-input bg-background p-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground">
          {emails.map((email) => (
            <p
              key={email}
              className="flex h-full flex-row items-center gap-1 border border-gray-200 bg-gray-100 p-0.5 px-1 text-primary shadow"
            >
              <span>{email}</span>
              <X
                className="size-3 text-muted-foreground hover:cursor-pointer hover:text-primary"
                onClick={() => {
                  setEmails((emails) => emails.filter((e) => e !== email));
                }}
              />
            </p>
          ))}
          <input
            value={input}
            className="flex-grow px-1 focus-visible:outline-none"
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter email addresses"
            onKeyUp={(e) => {
              if (e.key === 'Enter') {
                if (!input.length) {
                  return;
                }

                if (emails.includes(input)) {
                  return;
                }

                if (!isValidEmail(input)) {
                  return;
                }

                setEmails((emails) => [...emails, input]);
                setInput('');
              }
            }}
          />
        </div>
        <Button
          variant="outline"
          className="w-32"
          disabled={isPending || emails.length == 0}
          onClick={() => {
            if (isPending) {
              return;
            }

            mutate({
              input: {
                type: 'workspace_users_invite',
                emails: emails,
                userId: workspace.userId,
                role: 'collaborator',
              },
              onSuccess() {
                setEmails([]);
                setInput('');
              },
              onError() {
                toast({
                  title: 'Failed to invite users',
                  description:
                    'Something went wrong inviting userts to workspace. Please try again!',
                  variant: 'destructive',
                });
              },
            });
          }}
        >
          {isPending && <Spinner className="mr-1" />}
          Invite
        </Button>
      </div>
    </div>
  );
};
