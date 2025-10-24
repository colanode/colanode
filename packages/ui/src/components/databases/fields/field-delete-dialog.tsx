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
import { useDatabase } from '@colanode/ui/contexts/database';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { database as appDatabase } from '@colanode/ui/data';

interface FieldDeleteDialogProps {
  id: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const FieldDeleteDialog = ({
  id,
  open,
  onOpenChange,
}: FieldDeleteDialogProps) => {
  const workspace = useWorkspace();
  const database = useDatabase();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Are you sure you want delete this field?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This field will no longer be
            accessible and all data in the field will be lost.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={() => {
              const nodes = appDatabase.workspace(workspace.userId).nodes;
              if (!nodes.has(database.id)) {
                console.error('Database not found');
                return;
              }

              nodes.update(database.id, (draft) => {
                if (draft.attributes.type !== 'database') {
                  console.error('Database not found');
                  return;
                }

                delete draft.attributes.fields[id];
              });

              onOpenChange(false);
            }}
          >
            Delete
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
