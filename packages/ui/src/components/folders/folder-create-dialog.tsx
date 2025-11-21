import { toast } from 'sonner';

import { generateId, IdType } from '@colanode/core';
import { FolderForm } from '@colanode/ui/components/folders/folder-form';
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

interface FolderCreateDialogProps {
  parentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const FolderCreateDialog = ({
  parentId,
  open,
  onOpenChange,
}: FolderCreateDialogProps) => {
  const { t } = useI18n();
  const workspace = useWorkspace();
  const layout = useLayout();
  const { mutate, isPending } = useMutation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('folder.createFolder')}</DialogTitle>
          <DialogDescription>
            {t('folder.createFolderDescription')}
          </DialogDescription>
        </DialogHeader>
        <FolderForm
          id={generateId(IdType.Folder)}
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
                type: 'folder.create',
                parentId: parentId,
                name: values.name,
                avatar: values.avatar,
                accountId: workspace.accountId,
                workspaceId: workspace.id,
                generateIndex: true,
              },
              onSuccess(output) {
                onOpenChange(false);
                layout.previewLeft(output.id);
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
