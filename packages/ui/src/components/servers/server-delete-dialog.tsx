import { toast } from 'sonner';

import { Server } from '@colanode/client/types';
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
import { useMutation } from '@colanode/ui/hooks/use-mutation';

interface ServerDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  server: Server;
}

export const ServerDeleteDialog = ({
  server,
  open,
  onOpenChange,
}: ServerDeleteDialogProps) => {
  const { t } = useI18n();
  const { mutate, isPending } = useMutation();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t('server.deleteServer')}{' '}
            <span className="font-bold">&quot;{server.domain}&quot;</span>?
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t('server.deleteServerDescription')}
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
                  type: 'server.delete',
                  domain: server.domain,
                },
                onSuccess() {
                  onOpenChange(false);
                  toast.success(t('server.serverDeleted'));
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
