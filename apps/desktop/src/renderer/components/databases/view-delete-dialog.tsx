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
import { useDatabase } from '@/renderer/contexts/database';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useMutation } from '@/renderer/hooks/use-mutation';
import { toast } from '@/renderer/hooks/use-toast';

interface ViewDeleteDialogProps {
  id: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ViewDeleteDialog = ({
  id,
  open,
  onOpenChange,
}: ViewDeleteDialogProps) => {
  const workspace = useWorkspace();
  const database = useDatabase();
  const { mutate, isPending } = useMutation();

  if (!database.canEdit) {
    return null;
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Are you sure you want delete this view?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This view will no longer be accessible
            and all data in the view will be lost.
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
                  type: 'view_delete',
                  viewId: id,
                  databaseId: database.id,
                  userId: workspace.userId,
                },
                onSuccess() {
                  onOpenChange(false);
                },
                onError(error) {
                  toast({
                    title: 'Failed to delete view',
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
