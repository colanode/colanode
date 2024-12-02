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
import { toast } from '@/renderer/hooks/use-toast';

interface FileDeleteDialogProps {
  nodeId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const FileDeleteDialog = ({
  nodeId,
  open,
  onOpenChange,
}: FileDeleteDialogProps) => {
  const workspace = useWorkspace();
  const { mutate, isPending } = useMutation();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Are you sure you want delete this file?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This file will no longer be accessible
            and all data in the file will be lost.
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
                  type: 'file_delete',
                  fileId: nodeId,
                  userId: workspace.userId,
                },
                onSuccess() {
                  onOpenChange(false);
                },
                onError(error) {
                  toast({
                    title: 'Failed to delete file',
                    description: error.message,
                    variant: 'destructive',
                  });
                },
              });
            }}
          >
            Delete
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
