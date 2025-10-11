import { X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { isValidEmail } from '@colanode/core';
import { Button } from '@colanode/ui/components/ui/button';
import { Spinner } from '@colanode/ui/components/ui/spinner';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useMutation } from '@colanode/ui/hooks/use-mutation';

export const WorkspaceUserInvite = () => {
  const workspace = useWorkspace();
  const { mutate, isPending } = useMutation();

  const [input, setInput] = useState('');
  const [emails, setEmails] = useState<string[]>([]);
  const isInputValidEmail = isValidEmail(input);

  return (
    <div className="flex flex-col space-y-2">
      <p className="text-sm text-muted-foreground">
        Write the email addresses of the people you want to invite
      </p>
      <div className="flex flex-row items-center gap-1">
        <div className="flex h-9 w-full flex-row gap-2 rounded-md border border-input bg-background p-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground">
          {emails.map((email) => (
            <p
              key={email}
              className="flex h-full flex-row items-center gap-1 border border-border bg-accent p-0.5 px-1 text-foreground shadow"
            >
              <span>{email}</span>
              <X
                className="size-3 text-muted-foreground cursor-pointer hover:text-foreground"
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
                userId: workspace.userId,
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
