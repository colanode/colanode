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

interface PageDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pageId: string;
}

export const PageDeleteDialog = ({
  pageId,
  open,
  onOpenChange,
}: PageDeleteDialogProps) => {
  const { t } = useI18n();
  const workspace = useWorkspace();
  const navigate = useNavigate({ from: '/workspace/$userId' });
  const { mutate, isPending } = useMutation();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('page.deletePageConfirm')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('page.deletePageDescription')}
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
                  type: 'page.delete',
                  pageId,
                  userId: workspace.userId,
                },
                onSuccess() {
                  onOpenChange(false);
                  navigate({
                    to: '/',
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
