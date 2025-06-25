import { X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Workspace } from '@colanode/client/types';
import { isValidEmail } from '@colanode/core';
import { Button } from '@colanode/ui/components/ui/button';
import { Spinner } from '@colanode/ui/components/ui/spinner';
import { useMutation } from '@colanode/ui/hooks/use-mutation';

interface WorkspaceUserInviteProps {
  workspace: Workspace;
}

export const WorkspaceUserInvite = ({
  workspace,
}: WorkspaceUserInviteProps) => {
  const { mutate, isPending } = useMutation();

  const [input, setInput] = useState('');
  const [emails, setEmails] = useState<string[]>([]);
  const isInputValidEmail = isValidEmail(input);

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
                className="size-3 text-muted-foreground cursor-pointer hover:text-primary"
                onClick={() => {
                  setEmails((emails) => emails.filter((e) => e !== email));
                }}
              />
            </p>
          ))}
          <input
            value={input}
            className="flex-grow px-1 focus-visible:outline-none"
            onChange={(e) => setInput(e.target.value.trim())}
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
          disabled={isPending || (emails.length == 0 && !isInputValidEmail)}
          onClick={() => {
            if (isPending) {
              return;
            }

            const emailsToInvite = [...emails];
            if (isInputValidEmail && !emails.includes(input)) {
              emailsToInvite.push(input);
            }

            mutate({
              input: {
                type: 'users.create',
                users: emailsToInvite.map((email) => ({
                  email,
                  role: 'collaborator',
                })),
                accountId: workspace.accountId,
                workspaceId: workspace.id,
              },
              onSuccess() {
                setEmails([]);
                setInput('');
              },
              onError(error) {
                toast.error(error.message);
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
