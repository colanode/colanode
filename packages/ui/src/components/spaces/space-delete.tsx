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

interface SpaceDeleteProps {
  id: string;
  onDeleted: () => void;
}

export const SpaceDelete = ({ id, onDeleted }: SpaceDeleteProps) => {
  const { t } = useI18n();
  const workspace = useWorkspace();
  const { mutate, isPending } = useMutation();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between gap-6">
        <div className="flex-1 space-y-2">
          <h3 className="font-semibold">{t('space.deleteSpace')}</h3>
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
            <AlertDialogTitle>{t('space.deleteSpaceConfirm')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('space.deleteSpaceDescription')}
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
                    type: 'space.delete',
                    accountId: workspace.accountId,
                    workspaceId: workspace.id,
                    spaceId: id,
                  },
                  onSuccess() {
                    setShowDeleteModal(false);
                    onDeleted();
                    toast.success(t('space.deleteSpace'));
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
