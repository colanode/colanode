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
import { useLayout } from '@colanode/ui/contexts/layout';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useMutation } from '@colanode/ui/hooks/use-mutation';

interface PageCreateDialogProps {
  parentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PageCreateDialog = ({
  parentId,
  open,
  onOpenChange,
}: PageCreateDialogProps) => {
  const { t } = useI18n();
  const workspace = useWorkspace();
  const layout = useLayout();
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
                parentId: parentId,
                name: values.name,
                avatar: values.avatar,
                accountId: workspace.accountId,
                workspaceId: workspace.id,
                generateIndex: true,
              },
              onSuccess(output) {
                onOpenChange(false);
                layout.openLeft(output.id);
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
