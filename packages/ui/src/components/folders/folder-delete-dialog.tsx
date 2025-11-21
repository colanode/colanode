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
import { useLayout } from '@colanode/ui/contexts/layout';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useMutation } from '@colanode/ui/hooks/use-mutation';

interface FolderDeleteDialogProps {
  folderId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const FolderDeleteDialog = ({
  folderId,
  open,
  onOpenChange,
}: FolderDeleteDialogProps) => {
  const { t } = useI18n();
  const workspace = useWorkspace();
  const layout = useLayout();
  const { mutate, isPending } = useMutation();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('folder.deleteFolderConfirm')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('folder.deleteFolderDescription')}
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
                  type: 'folder.delete',
                  folderId: folderId,
                  accountId: workspace.accountId,
                  workspaceId: workspace.id,
                },
                onSuccess() {
                  onOpenChange(false);
                  layout.close(folderId);
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
