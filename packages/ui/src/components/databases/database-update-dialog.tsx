import { LocalDatabaseNode } from '@colanode/client/types';
import { NodeRole, hasNodeRole } from '@colanode/core';
import { collections } from '@colanode/ui/collections';
import { DatabaseForm } from '@colanode/ui/components/databases/database-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@colanode/ui/components/ui/dialog';
import { useWorkspace } from '@colanode/ui/contexts/workspace';

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
            name: database.attributes.name,
            avatar: database.attributes.avatar,
          }}
          isPending={false}
          submitText="Update"
          readOnly={!canEdit}
          onCancel={() => {
            onOpenChange(false);
          }}
          onSubmit={(values) => {
            const nodes = collections.workspace(workspace.userId).nodes;
            if (!nodes.has(database.id)) {
              return;
            }

            nodes.update(database.id, (draft) => {
              if (draft.attributes.type !== 'database') {
                return;
              }

              draft.attributes.name = values.name;
              draft.attributes.avatar = values.avatar;
            });

            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
};
