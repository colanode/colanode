import { useWorkspace } from '@/renderer/contexts/workspace';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/renderer/components/ui/dialog';
import { useMutation } from '@/renderer/hooks/use-mutation';
import { IdType } from '@colanode/core';
import { ChannelForm } from '@/renderer/components/channels/channel-form';
import { generateId } from '@colanode/core';

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
  const { mutate, isPending } = useMutation();

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
            avatar: null,
          }}
          isPending={isPending}
          submitText="Create"
          handleCancel={() => {
            onOpenChange(false);
          }}
          handleSubmit={(values) => {
            console.log('submit', values);
            if (isPending) {
              return;
            }

            mutate({
              input: {
                type: 'channel_create',
                spaceId: spaceId,
                name: values.name,
                avatar: values.avatar,
                userId: workspace.userId,
              },
              onSuccess(output) {
                onOpenChange(false);
                workspace.openInMain(output.id);
              },
            });
          }}
        />
      </DialogContent>
    </Dialog>
  );
};
