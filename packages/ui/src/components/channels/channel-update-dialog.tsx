import { LocalChannelNode } from '@colanode/client/types';
import { NodeRole, hasNodeRole } from '@colanode/core';
import { ChannelForm } from '@colanode/ui/components/channels/channel-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@colanode/ui/components/ui/dialog';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { database } from '@colanode/ui/data';

interface ChannelUpdateDialogProps {
  channel: LocalChannelNode;
  role: NodeRole;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ChannelUpdateDialog = ({
  channel,
  role,
  open,
  onOpenChange,
}: ChannelUpdateDialogProps) => {
  const workspace = useWorkspace();
  const canEdit = hasNodeRole(role, 'editor');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update channel</DialogTitle>
          <DialogDescription>
            Update the channel name and icon
          </DialogDescription>
        </DialogHeader>
        <ChannelForm
          id={channel.id}
          values={{
            name: channel.attributes.name,
            avatar: channel.attributes.avatar,
          }}
          isPending={false}
          submitText="Update"
          readOnly={!canEdit}
          onCancel={() => {
            onOpenChange(false);
          }}
          onSubmit={(values) => {
            const nodes = database.workspace(workspace.userId).nodes;
            if (!nodes.has(channel.id)) {
              return;
            }

            nodes.update(channel.id, (draft) => {
              if (draft.attributes.type !== 'channel') {
                return;
              }

              draft.attributes.name = values.name;
              draft.attributes.avatar = values.avatar;
            });

            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
};
