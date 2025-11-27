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
import { useI18n } from '@colanode/ui/contexts/i18n';
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
  const { t } = useI18n();
  const workspace = useWorkspace();
  const { mutate, isPending } = useMutation();
  const canEdit = hasNodeRole(role, 'editor');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('channel.updateChannel')}</DialogTitle>
          <DialogDescription>
            {t('channel.updateChannelDescription')}
          </DialogDescription>
        </DialogHeader>
        <ChannelForm
          id={channel.id}
          values={{
            name: channel.attributes.name,
            avatar: channel.attributes.avatar,
          }}
          isPending={isPending}
          submitText={t('common.update')}
          readOnly={!canEdit}
          handleCancel={() => {
            onOpenChange(false);
          }}
          handleSubmit={(values) => {
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
                toast.success(t('channel.updateChannel'));
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
