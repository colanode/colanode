import { FolderNode, hasEditorAccess, NodeRole } from '@colanode/core';

import { FolderForm } from '@/renderer/components/folders/folder-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/renderer/components/ui/dialog';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useMutation } from '@/renderer/hooks/use-mutation';
import { toast } from '@/renderer/hooks/use-toast';

interface FolderUpdateDialogProps {
  folder: FolderNode;
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
  const canEdit = hasEditorAccess(role);

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
                type: 'folder_update',
                folderId: folder.id,
                name: values.name,
                avatar: values.avatar,
                userId: workspace.userId,
              },
              onSuccess() {
                onOpenChange(false);
                toast({
                  title: 'Folder updated',
                  description: 'Folder was updated successfully',
                  variant: 'default',
                });
              },
              onError(error) {
                toast({
                  title: 'Failed to update folder',
                  description: error.message,
                  variant: 'destructive',
                });
              },
            });
          }}
        />
      </DialogContent>
    </Dialog>
  );
};
