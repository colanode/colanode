import { Trash2 } from 'lucide-react';
import { Fragment, useState } from 'react';
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

interface MessageDeleteButtonProps {
  id: string;
}

export const MessageDeleteButton = ({ id }: MessageDeleteButtonProps) => {
  const { t } = useI18n();
  const workspace = useWorkspace();
  const { mutate, isPending } = useMutation();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  return (
    <Fragment>
      <Trash2
        className="size-4 cursor-pointer"
        onClick={() => setShowDeleteModal(true)}
      />
      <AlertDialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('message.deleteMessageConfirm')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('message.deleteMessageDescription')}
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
                    type: 'message.delete',
                    messageId: id,
                    accountId: workspace.accountId,
                    workspaceId: workspace.id,
                  },
                  onSuccess() {
                    setShowDeleteModal(false);
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
    </Fragment>
  );
};
