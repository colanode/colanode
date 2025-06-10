import { Trash2 } from 'lucide-react';
import { Fragment, useState } from 'react';
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

interface MessageDeleteButtonProps {
  id: string;
}

export const MessageDeleteButton = ({ id }: MessageDeleteButtonProps) => {
  const workspace = useWorkspace();
  const { mutate, isPending } = useMutation();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  return (
    <Fragment>
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
                    type: 'message.delete',
                    messageId: id,
                    accountId: workspace.accountId,
                    workspaceId: workspace.id,
                  },
                  onSuccess() {
                    setShowDeleteModal(false);
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
    </Fragment>
  );
};
