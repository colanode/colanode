import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';

import { LocalChannelNode } from '@colanode/client/types';
import { generateId, IdType } from '@colanode/core';
import { collections } from '@colanode/ui/collections';
import {
  ChannelForm,
  ChannelFormValues,
} from '@colanode/ui/components/channels/channel-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@colanode/ui/components/ui/dialog';
import { useWorkspace } from '@colanode/ui/contexts/workspace';

interface ChannelCreateDialogProps {
  spaceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ChannelCreateDialog = ({
  spaceId,
  open,
  onOpenChange,
}: ChannelCreateDialogProps) => {
  const workspace = useWorkspace();
  const navigate = useNavigate({ from: '/workspace/$userId' });

  const { mutate, isPending } = useMutation({
    mutationFn: async (values: ChannelFormValues) => {
      const channelId = generateId(IdType.Channel);
      const nodes = collections.workspace(workspace.userId).nodes;

      const channel: LocalChannelNode = {
        id: channelId,
        type: 'channel',
        attributes: {
          type: 'channel',
          name: values.name,
          parentId: spaceId,
        },
        parentId: spaceId,
        rootId: spaceId,
        createdAt: new Date().toISOString(),
        createdBy: workspace.userId,
        updatedAt: null,
        updatedBy: null,
        localRevision: '0',
        serverRevision: '0',
      };

      nodes.insert(channel);
      return channel;
    },
    onSuccess: (channel) => {
      navigate({
        to: '$nodeId',
        params: {
          nodeId: channel.id,
        },
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create channel</DialogTitle>
          <DialogDescription>
            Create a new channel to collaborate with your peers
          </DialogDescription>
        </DialogHeader>
        <ChannelForm
          id={generateId(IdType.Channel)}
          values={{
            name: '',
          }}
          isPending={isPending}
          submitText="Create"
          onCancel={() => {
            onOpenChange(false);
          }}
          onSubmit={(values) => mutate(values)}
        />
      </DialogContent>
    </Dialog>
  );
};
