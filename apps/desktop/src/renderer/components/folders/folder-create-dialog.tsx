import { generateId, IdType } from '@colanode/core';

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
  const { mutate, isPending } = useMutation();

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
            avatar: null,
          }}
          isPending={isPending}
          submitText="Create"
          handleCancel={() => {
            onOpenChange(false);
          }}
          handleSubmit={(values) => {
            console.log('submit', values);
            if (isPending) {
              return;
            }

            mutate({
              input: {
                type: 'folder_create',
                parentId: spaceId,
                name: values.name,
                avatar: values.avatar,
                userId: workspace.userId,
                generateIndex: true,
              },
              onSuccess(output) {
                onOpenChange(false);
                workspace.openInMain(output.id);
              },
              onError(error) {
                toast({
                  title: 'Failed to create folder',
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
