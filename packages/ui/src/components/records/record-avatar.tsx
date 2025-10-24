import { Avatar } from '@colanode/ui/components/avatars/avatar';
import { AvatarPopover } from '@colanode/ui/components/avatars/avatar-popover';
import { Button } from '@colanode/ui/components/ui/button';
import { useRecord } from '@colanode/ui/contexts/record';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { database as appDatabase } from '@colanode/ui/data';

export const RecordAvatar = () => {
  const workspace = useWorkspace();
  const record = useRecord();

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
        if (avatar === record.avatar) return;

        const nodes = appDatabase.workspace(workspace.userId).nodes;
        if (!nodes.has(record.id)) {
          return;
        }

        nodes.update(record.id, (draft) => {
          if (draft.attributes.type !== 'record') {
            return;
          }

          draft.attributes.avatar = avatar;
        });
      }}
    >
      <Button type="button" variant="outline" size="icon">
        <Avatar
          id={record.id}
          name={record.name}
          avatar={record.avatar}
          className="size-6"
        />
      </Button>
    </AvatarPopover>
  );
};
