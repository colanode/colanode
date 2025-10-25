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
import { useDatabase } from '@colanode/ui/contexts/database';
import { useWorkspace } from '@colanode/ui/contexts/workspace';

interface SelectOptionDeleteDialogProps {
  fieldId: string;
  optionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SelectOptionDeleteDialog = ({
  fieldId,
  optionId,
  open,
  onOpenChange,
}: SelectOptionDeleteDialogProps) => {
  const workspace = useWorkspace();
  const database = useDatabase();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Are you sure you want delete this select option?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This option will no longer be
            accessible and all data in the option will be lost.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={() => {
              const nodes = collections.workspace(workspace.userId).nodes;
              if (!nodes.has(database.id)) {
                return;
              }

              nodes.update(database.id, (draft) => {
                if (draft.attributes.type !== 'database') {
                  return;
                }

                const fieldDraft = draft.attributes.fields[fieldId];
                if (!fieldDraft) {
                  return;
                }

                if (
                  fieldDraft.type !== 'select' &&
                  fieldDraft.type !== 'multi_select'
                ) {
                  return;
                }

                if (!fieldDraft.options) {
                  return;
                }

                delete fieldDraft.options[optionId];
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
