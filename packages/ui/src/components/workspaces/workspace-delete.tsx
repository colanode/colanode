import { useState } from 'react';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@colanode/ui/components/ui/alert-dialog';
import { Button } from '@colanode/ui/components/ui/button';
import { Spinner } from '@colanode/ui/components/ui/spinner';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useMutation } from '@colanode/ui/hooks/use-mutation';

interface WorkspaceDeleteProps {
  onDeleted: () => void;
}

export const WorkspaceDelete = ({ onDeleted }: WorkspaceDeleteProps) => {
  const workspace = useWorkspace();
  const { mutate, isPending } = useMutation();

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <h3 className="font-heading mb-px text-2xl font-semibold tracking-tight">
        Delete workspace
      </h3>
      <p>Deleting a workspace is permanent and cannot be undone.</p>
      <p>
        All data associated with the workspace will be deleted, including users,
        chats, messages, pages, channels, databases, records, files and more.
      </p>
      <div>
        <Button
          variant="destructive"
          onClick={() => {
            setShowDeleteModal(true);
          }}
        >
          Delete
        </Button>
      </div>
      <AlertDialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want delete this workspace?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This workspace will no longer be
              accessible by you or other users that are part of it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={isPending}
              onClick={() => {
                mutate({
                  input: {
                    type: 'workspace.delete',
                    accountId: workspace.accountId,
                    workspaceId: workspace.id,
                  },
                  onSuccess() {
                    setShowDeleteModal(false);
                    onDeleted();
                    toast.success('Workspace was deleted successfully');
                  },
                  onError(error) {
                    toast.error(error.message);
                  },
                });
              }}
            >
              {isPending && <Spinner className="mr-1" />}
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
