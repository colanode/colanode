import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';

import { generateId, IdType } from '@colanode/core';
import { PageForm } from '@colanode/ui/components/pages/page-form';
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

interface PageCreateDialogProps {
  spaceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PageCreateDialog = ({
  spaceId,
  open,
  onOpenChange,
}: PageCreateDialogProps) => {
  const { t } = useI18n();
  const workspace = useWorkspace();
  const navigate = useNavigate({ from: '/workspace/$userId' });
  const { mutate, isPending } = useMutation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('page.createPage')}</DialogTitle>
          <DialogDescription>
            {t('page.createPageDescription')}
          </DialogDescription>
        </DialogHeader>
        <PageForm
          id={generateId(IdType.Page)}
          values={{
            name: '',
          }}
          isPending={isPending}
          submitText={t('common.create')}
          handleCancel={() => {
            onOpenChange(false);
          }}
          handleSubmit={(values) => {
            if (isPending) {
              return;
            }

            mutate({
              input: {
                type: 'page.create',
                parentId: spaceId,
                name: values.name,
                avatar: values.avatar,
                userId: workspace.userId,
                generateIndex: true,
              },
              onSuccess(output) {
                onOpenChange(false);
                navigate({
                  to: '$nodeId',
                  params: {
                    nodeId: output.id,
                  },
                });
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
