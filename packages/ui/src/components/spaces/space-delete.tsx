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

interface SpaceDeleteProps {
  id: string;
  onDeleted: () => void;
}

export const SpaceDelete = ({ id, onDeleted }: SpaceDeleteProps) => {
  const workspace = useWorkspace();
  const { mutate, isPending } = useMutation();

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between gap-6">
        <div className="flex-1 space-y-2">
          <h3 className="font-semibold">Delete space</h3>
          <p className="text-sm text-muted-foreground">
            Once you delete a space, there is no going back. Please be certain.
          </p>
        </div>
        <div className="flex-shrink-0">
          <Button
            variant="destructive"
            onClick={() => {
              setShowDeleteModal(true);
            }}
            className="w-20"
          >
            Delete
          </Button>
        </div>
      </div>
      <AlertDialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want delete this space?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This space will no longer be
              accessible by you or others you&apos;ve shared it with.
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
                    type: 'space.delete',
                    accountId: workspace.accountId,
                    workspaceId: workspace.id,
                    spaceId: id,
                  },
                  onSuccess() {
                    setShowDeleteModal(false);
                    onDeleted();
                    toast.success('Space deleted');
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
    </>
  );
};
