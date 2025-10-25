import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
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

interface RecordDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recordId: string;
}

export const RecordDeleteDialog = ({
  recordId,
  open,
  onOpenChange,
}: RecordDeleteDialogProps) => {
  const workspace = useWorkspace();
  const navigate = useNavigate({ from: '/workspace/$userId' });
  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const nodes = collections.workspace(workspace.userId).nodes;
      nodes.delete(recordId);
    },
    onSuccess: () => {
      navigate({ to: 'home', replace: true });
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Are you sure you want delete this record?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This record will no longer be
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
  );
};
