import { Avatar } from '@/renderer/components/avatars/avatar';
import { AvatarPopover } from '@/renderer/components/avatars/avatar-popover';
import { Button } from '@/renderer/components/ui/button';
import { useRecord } from '@/renderer/contexts/record';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useMutation } from '@/renderer/hooks/use-mutation';
import { toast } from '@/renderer/hooks/use-toast';

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
            type: 'record_avatar_update',
            recordId: record.id,
            avatar,
            userId: workspace.userId,
          },
          onError(error) {
            toast({
              title: 'Failed to update record avatar',
              description: error.message,
              variant: 'destructive',
            });
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
