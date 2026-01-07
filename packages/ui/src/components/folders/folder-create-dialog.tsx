import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';

import { LocalFolderNode } from '@colanode/client/types';
import { generateId, IdType } from '@colanode/core';
import {
  FolderForm,
  FolderFormValues,
} from '@colanode/ui/components/folders/folder-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@colanode/ui/components/ui/dialog';
import { useWorkspace } from '@colanode/ui/contexts/workspace';

interface FolderCreateDialogProps {
  spaceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const FolderCreateDialog = ({
  spaceId,
  open,
  onOpenChange,
}: FolderCreateDialogProps) => {
  const workspace = useWorkspace();
  const navigate = useNavigate({ from: '/workspace/$userId' });
  const { mutate } = useMutation({
    mutationFn: async (values: FolderFormValues) => {
      const folderId = generateId(IdType.Folder);
      const nodes = workspace.collections.nodes;

      const folder: LocalFolderNode = {
        id: folderId,
        type: 'folder',
        name: values.name,
        avatar: values.avatar,
        parentId: spaceId,
        rootId: spaceId,
        createdAt: new Date().toISOString(),
        createdBy: workspace.userId,
        updatedAt: null,
        updatedBy: null,
        localRevision: '0',
        serverRevision: '0',
      };

      nodes.insert(folder);
      return folder;
    },
    onSuccess: (folder) => {
      navigate({
        to: '$nodeId',
        params: {
          nodeId: folder.id,
        },
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create folder</DialogTitle>
          <DialogDescription>
            Create a new folder to organize your pages
          </DialogDescription>
        </DialogHeader>
        <FolderForm
          id={generateId(IdType.Folder)}
          values={{
            name: '',
          }}
          submitText="Create"
          onCancel={() => {
            onOpenChange(false);
          }}
          onSubmit={(values) => {
            mutate(values);
          }}
        />
      </DialogContent>
    </Dialog>
  );
};
