import { toast } from 'sonner';

import { LocalFolderNode } from '@colanode/client/types';
import { NodeRole, hasNodeRole } from '@colanode/core';
import { FolderForm } from '@colanode/ui/components/folders/folder-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@colanode/ui/components/ui/dialog';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useMutation } from '@colanode/ui/hooks/use-mutation';

interface FolderUpdateDialogProps {
  folder: LocalFolderNode;
  role: NodeRole;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const FolderUpdateDialog = ({
  folder,
  role,
  open,
  onOpenChange,
}: FolderUpdateDialogProps) => {
  const workspace = useWorkspace();
  const { mutate, isPending } = useMutation();
  const canEdit = hasNodeRole(role, 'editor');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update folder</DialogTitle>
          <DialogDescription>Update the folder name and icon</DialogDescription>
        </DialogHeader>
        <FolderForm
          id={folder.id}
          values={{
            name: folder.attributes.name,
            avatar: folder.attributes.avatar,
          }}
          isPending={isPending}
          submitText="Update"
          readOnly={!canEdit}
          handleCancel={() => {
            onOpenChange(false);
          }}
          handleSubmit={(values) => {
            if (isPending) {
              return;
            }

            mutate({
              input: {
                type: 'folder.update',
                folderId: folder.id,
                name: values.name,
                avatar: values.avatar,
                accountId: workspace.accountId,
                workspaceId: workspace.id,
              },
              onSuccess() {
                onOpenChange(false);
                toast.success('Folder was updated successfully');
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
