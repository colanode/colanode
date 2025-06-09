import { toast } from 'sonner';

import { Avatar } from '@colanode/ui/components/avatars/avatar';
import { AvatarPopover } from '@colanode/ui/components/avatars/avatar-popover';
import { Button } from '@colanode/ui/components/ui/button';
import { useRecord } from '@colanode/ui/contexts/record';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useMutation } from '@colanode/ui/hooks/use-mutation';

export const RecordAvatar = () => {
  const workspace = useWorkspace();
  const record = useRecord();

  const { mutate, isPending } = useMutation();

  if (!record.canEdit) {
    return (
      <Button type="button" variant="outline" size="icon">
        <Avatar
          id={record.id}
          name={record.name}
          avatar={record.avatar}
          className="h-6 w-6"
        />
      </Button>
    );
  }

  return (
    <AvatarPopover
      onPick={(avatar) => {
        if (isPending) return;
        if (avatar === record.avatar) return;

        mutate({
          input: {
            type: 'record.avatar.update',
            recordId: record.id,
            avatar,
            accountId: workspace.accountId,
            workspaceId: workspace.id,
          },
          onError(error) {
            toast.error(error.message);
          },
        });
      }}
    >
      <Button type="button" variant="outline" size="icon">
        <Avatar
          id={record.id}
          name={record.name}
          avatar={record.avatar}
          className="h-6 w-6"
        />
      </Button>
    </AvatarPopover>
  );
};
