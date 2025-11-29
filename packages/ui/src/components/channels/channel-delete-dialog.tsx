import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@colanode/ui/components/ui/alert-dialog';
import { Button } from '@colanode/ui/components/ui/button';
import { Spinner } from '@colanode/ui/components/ui/spinner';
import { useI18n } from '@colanode/ui/contexts/i18n';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useMutation } from '@colanode/ui/hooks/use-mutation';

interface ChannelDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channelId: string;
}

export const ChannelDeleteDialog = ({
  channelId,
  open,
  onOpenChange,
}: ChannelDeleteDialogProps) => {
  const { t } = useI18n();
  const workspace = useWorkspace();
  const navigate = useNavigate({ from: '/workspace/$userId' });
  const { mutate, isPending } = useMutation();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t('channel.deleteChannelConfirm')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t('channel.deleteChannelDescription')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={isPending}
            onClick={() => {
              mutate({
                input: {
                  type: 'channel.delete',
                  channelId,
                  userId: workspace.userId,
                },
                onSuccess() {
                  onOpenChange(false);
                  navigate({
                    to: '/',
                    replace: true,
                  });
                },
                onError(error) {
                  toast.error(error.message);
                },
              });
            }}
          >
            {isPending && <Spinner className="mr-1" />}
            {t('common.delete')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
