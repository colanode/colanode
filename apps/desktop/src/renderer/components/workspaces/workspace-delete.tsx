import React from 'react';

import { Button } from '@/renderer/components/ui/button';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useMutation } from '@/renderer/hooks/use-mutation';
import { toast } from '@/renderer/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/renderer/components/ui/alert-dialog';
import { Spinner } from '@/renderer/components/ui/spinner';
import { useServer } from '@/renderer/contexts/server';

interface WorkspaceDeleteProps {
  onDeleted: () => void;
}

export const WorkspaceDelete = ({ onDeleted }: WorkspaceDeleteProps) => {
  const server = useServer();
  const workspace = useWorkspace();
  const { mutate, isPending } = useMutation();

  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const isDeleteSupported = server.supports('workspace-delete');

  if (!isDeleteSupported) {
    return (
      <div className="flex flex-col gap-4">
        <h3 className="font-heading mb-px text-2xl font-semibold tracking-tight">
          Delete workspace
        </h3>
        <p>
          This feature is not supported on the server this workspace is hosted
          on. Please contact your administrator to upgrade the server.
        </p>
      </div>
    );
  }

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
                    type: 'workspace_delete',
                    accountId: workspace.accountId,
                    workspaceId: workspace.id,
                  },
                  onSuccess() {
                    setShowDeleteModal(false);
                    onDeleted();
                    toast({
                      title: 'Workspace deleted',
                      description: 'Workspace was deleted successfully',
                      variant: 'default',
                    });
                  },
                  onError(error) {
                    toast({
                      title: 'Failed to delete workspace',
                      description: error.message,
                      variant: 'destructive',
                    });
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
