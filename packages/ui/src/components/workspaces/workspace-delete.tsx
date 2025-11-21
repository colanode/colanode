import { useState } from 'react';
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

export const WorkspaceDelete = () => {
  const { t } = useI18n();
  const workspace = useWorkspace();
  const { mutate, isPending } = useMutation();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between gap-6">
        <div className="flex-1 space-y-2">
          <h3 className="font-semibold">{t('workspace.deleteWorkspace')}</h3>
          <p className="text-sm text-muted-foreground">
            {t('workspace.deleteWorkspaceDescription')}
          </p>
        </div>
        <div className="flex-shrink-0">
          <Button
            variant="destructive"
            onClick={() => {
              setShowDeleteModal(true);
            }}
          >
            {t('common.delete')}
          </Button>
        </div>
      </div>
      <AlertDialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('workspace.deleteWorkspaceConfirm')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('workspace.deleteWorkspaceWarning')}
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
                    type: 'workspace.delete',
                    accountId: workspace.accountId,
                    workspaceId: workspace.id,
                  },
                  onSuccess() {
                    setShowDeleteModal(false);
                    toast.success(t('workspace.deleteWorkspace'));
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
    </>
  );
};
