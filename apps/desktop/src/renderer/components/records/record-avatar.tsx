import { Avatar } from '@/renderer/components/avatars/avatar';
import { AvatarPopover } from '@/renderer/components/avatars/avatar-popover';
import { Button } from '@/renderer/components/ui/button';
import { useRecord } from '@/renderer/contexts/record';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useMutation } from '@/renderer/hooks/use-mutation';

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
            type: 'node_attribute_set',
            nodeId: record.id,
            path: 'avatar',
            value: avatar,
            userId: workspace.userId,
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
