import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { LocalPageNode, LocalSpaceNode } from '@colanode/client/types';
import { generateId, IdType } from '@colanode/core';
import { collections } from '@colanode/ui/collections';
import {
  SpaceForm,
  SpaceFormValues,
} from '@colanode/ui/components/spaces/space-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@colanode/ui/components/ui/dialog';
import { useWorkspace } from '@colanode/ui/contexts/workspace';

interface SpaceCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SpaceCreateDialog = ({
  open,
  onOpenChange,
}: SpaceCreateDialogProps) => {
  const workspace = useWorkspace();

  const { mutate, isPending } = useMutation({
    mutationFn: async (values: SpaceFormValues) => {
      const nodes = collections.workspace(workspace.userId).nodes;

      const spaceId = generateId(IdType.Space);
      const space: LocalSpaceNode = {
        id: spaceId,
        type: 'space',
        attributes: {
          type: 'space',
          name: values.name,
          description: values.description,
          avatar: values.avatar,
          collaborators: {
            [workspace.userId]: 'admin',
          },
          visibility: 'private',
        },
        parentId: spaceId,
        rootId: spaceId,
        createdAt: new Date().toISOString(),
        createdBy: workspace.userId,
        updatedAt: null,
        updatedBy: null,
        localRevision: '0',
        serverRevision: '0',
      };

      const pageId = generateId(IdType.Page);
      const page: LocalPageNode = {
        id: pageId,
        type: 'page',
        attributes: {
          type: 'page',
          name: 'Home',
          parentId: spaceId,
        },
        parentId: spaceId,
        rootId: spaceId,
        createdAt: new Date().toISOString(),
        createdBy: workspace.userId,
        updatedAt: null,
        updatedBy: null,
        localRevision: '0',
        serverRevision: '0',
      };

      nodes.insert([space, page]);
      return space;
    },
    onSuccess: () => {
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-xl max-w-full">
        <DialogHeader>
          <DialogTitle>Create space</DialogTitle>
          <DialogDescription>
            Create a new space to collaborate with your peers
          </DialogDescription>
        </DialogHeader>
        <SpaceForm
          onSubmit={(values) => mutate(values)}
          isPending={isPending}
          saveText="Create"
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
};
