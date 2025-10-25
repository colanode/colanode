import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { toast } from 'sonner';

import { collections } from '@colanode/ui/collections';
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
import { useWorkspace } from '@colanode/ui/contexts/workspace';

interface SpaceDeleteProps {
  id: string;
}

export const SpaceDelete = ({ id }: SpaceDeleteProps) => {
  const workspace = useWorkspace();
  const navigate = useNavigate({ from: '/workspace/$userId' });

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const nodes = collections.workspace(workspace.userId).nodes;
      nodes.delete(id);
    },
    onSuccess: () => {
      navigate({ to: 'home', replace: true });
      setShowDeleteModal(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

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
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={isPending}
              onClick={() => mutate()}
            >
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
