import { SquarePen } from 'lucide-react';
import React from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@colanode/ui/components/ui/popover';
import { UserSearch } from '@colanode/ui/components/users/user-search';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useMutation } from '@colanode/ui/hooks/use-mutation';
import { toast } from '@colanode/ui/hooks/use-toast';
import { useLayout } from '@colanode/ui/contexts/layout';

export const ChatCreatePopover = () => {
  const workspace = useWorkspace();
  const { mutate, isPending } = useMutation();
  const layout = useLayout();

  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <SquarePen className="size-4 cursor-pointer" />
      </PopoverTrigger>
      <PopoverContent className="w-96 p-1">
        <UserSearch
          onSelect={(user) => {
            if (isPending) return;

            mutate({
              input: {
                type: 'chat_create',
                accountId: workspace.accountId,
                workspaceId: workspace.id,
                userId: user.id,
              },
              onSuccess(output) {
                layout.openLeft(output.id);
                setOpen(false);
              },
              onError(error) {
                toast({
                  title: 'Failed to create chat',
                  description: error.message,
                  variant: 'destructive',
                });
              },
            });
          }}
        />
      </PopoverContent>
    </Popover>
  );
};
