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
              const nodes = workspace.collections.nodes;
              nodes.update(database.id, (draft) => {
                if (draft.type !== 'database') {
                  return;
                }

                const fieldAttributes = draft.fields[fieldId];
                if (!fieldAttributes) {
                  return;
                }

                if (
                  fieldAttributes.type !== 'select' &&
                  fieldAttributes.type !== 'multi_select'
                ) {
                  return;
                }

                const { [optionId]: _removed, ...rest } = {
                  ...(fieldAttributes.options ?? {}),
                };

                if (fieldAttributes.type === 'select') {
                  const updated = {
                    ...fieldAttributes,
                    options: rest,
                  };

                  if (updated.default === optionId) {
                    delete updated.default;
                  }

                  draft.fields[fieldId] = updated;
                  return;
                }

                const nextDefaults = (fieldAttributes.default ?? []).filter(
                  (id) => id !== optionId
                );
                const updated = {
                  ...fieldAttributes,
                  options: rest,
                };

                if (nextDefaults.length > 0) {
                  updated.default = nextDefaults;
                } else {
                  delete updated.default;
                }

                draft.fields[fieldId] = updated;
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
