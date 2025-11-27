import { toast } from 'sonner';

import { SpaceForm } from '@colanode/ui/components/spaces/space-form';
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

interface SpaceCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SpaceCreateDialog = ({
  open,
  onOpenChange,
}: SpaceCreateDialogProps) => {
  const { t } = useI18n();
  const workspace = useWorkspace();
  const { mutate, isPending } = useMutation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-xl max-w-full">
        <DialogHeader>
          <DialogTitle>{t('space.createSpace')}</DialogTitle>
          <DialogDescription>
            {t('space.descriptionPlaceholder')}
          </DialogDescription>
        </DialogHeader>
        <SpaceForm
          onSubmit={(values) => {
            if (isPending) {
              return;
            }

            if (values.name.length < 3) {
              return;
            }

            mutate({
              input: {
                type: 'space.create',
                name: values.name,
                description: values.description,
                avatar: values.avatar,
                userId: workspace.userId,
              },
              onSuccess() {
                onOpenChange(false);
              },
              onError(error) {
                toast.error(error.message);
              },
            });
          }}
          isSaving={isPending}
          onCancel={() => {
            onOpenChange(false);
          }}
          saveText={t('common.create')}
        />
      </DialogContent>
    </Dialog>
  );
};
