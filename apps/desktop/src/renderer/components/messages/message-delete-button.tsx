import { Trash2 } from 'lucide-react';
import React from 'react';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/renderer/components/ui/alert-dialog';
import { Button } from '@/renderer/components/ui/button';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useMutation } from '@/renderer/hooks/use-mutation';

interface MessageDeleteButtonProps {
  id: string;
}

export const MessageDeleteButton = ({ id }: MessageDeleteButtonProps) => {
  const workspace = useWorkspace();
  const { mutate, isPending } = useMutation();
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);

  return (
    <React.Fragment>
      <Trash2
        className="size-4 cursor-pointer"
        onClick={() => setShowDeleteModal(true)}
      />
      <AlertDialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want delete this message?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This message will no longer be
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
                    type: 'node_delete',
                    nodeId: id,
                    userId: workspace.userId,
                  },
                  onSuccess() {
                    setShowDeleteModal(false);
                  },
                });
              }}
            >
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </React.Fragment>
  );
};
