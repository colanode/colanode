import { LocalFolderNode } from '@colanode/client/types';
import { NodeRole, hasNodeRole } from '@colanode/core';
import { collections } from '@colanode/ui/collections';
import { FolderForm } from '@colanode/ui/components/folders/folder-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@colanode/ui/components/ui/dialog';
import { useWorkspace } from '@colanode/ui/contexts/workspace';

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
          isPending={false}
          submitText="Update"
          readOnly={!canEdit}
          onCancel={() => {
            onOpenChange(false);
          }}
          onSubmit={(values) => {
            const nodes = collections.workspace(workspace.userId).nodes;
            if (!nodes.has(folder.id)) {
              return;
            }

            nodes.update(folder.id, (draft) => {
              if (draft.attributes.type !== 'folder') {
                return;
              }

              draft.attributes.name = values.name;
              draft.attributes.avatar = values.avatar;
            });

            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
};
