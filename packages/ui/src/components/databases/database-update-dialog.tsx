import { toast } from 'sonner';

import { LocalDatabaseNode } from '@colanode/client/types';
import { NodeRole, hasNodeRole } from '@colanode/core';
import { DatabaseForm } from '@colanode/ui/components/databases/database-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@colanode/ui/components/ui/dialog';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useMutation } from '@colanode/ui/hooks/use-mutation';

interface DatabaseUpdateDialogProps {
  database: LocalDatabaseNode;
  role: NodeRole;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DatabaseUpdateDialog = ({
  database,
  role,
  open,
  onOpenChange,
}: DatabaseUpdateDialogProps) => {
  const workspace = useWorkspace();
  const { mutate, isPending } = useMutation();
  const canEdit = hasNodeRole(role, 'editor');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update database</DialogTitle>
          <DialogDescription>
            Update the database name and icon
          </DialogDescription>
        </DialogHeader>
        <DatabaseForm
          id={database.id}
          values={{
            name: database.name,
            avatar: database.avatar,
          }}
          isPending={isPending}
          submitText="Update"
          readOnly={!canEdit}
          handleCancel={() => {
            onOpenChange(false);
          }}
          handleSubmit={(values) => {
            if (isPending) {
              return;
            }

            mutate({
              input: {
                type: 'database.update',
                databaseId: database.id,
                name: values.name,
                avatar: values.avatar,
                userId: workspace.userId,
              },
              onSuccess() {
                onOpenChange(false);
                toast.success('Database updated');
              },
              onError(error) {
                toast.error(error.message);
              },
            });
          }}
        />
      </DialogContent>
    </Dialog>
  );
};
