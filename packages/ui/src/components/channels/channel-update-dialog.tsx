import { toast } from 'sonner';

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
import { useMutation } from '@colanode/ui/hooks/use-mutation';

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
  const { mutate, isPending } = useMutation();
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
          isPending={isPending}
          submitText="Update"
          readOnly={!canEdit}
          onCancel={() => {
            onOpenChange(false);
          }}
          onSubmit={(values) => {
            if (isPending) {
              return;
            }

            mutate({
              input: {
                type: 'channel.update',
                channelId: channel.id,
                name: values.name,
                avatar: values.avatar,
                userId: workspace.userId,
              },
              onSuccess() {
                onOpenChange(false);
                toast.success('Channel updated');
              },
              onError(error) {
                toast.error(error.message);
              },
            });
          }}
        />
      </DialogContent>
    </Dialog>
  );
};
