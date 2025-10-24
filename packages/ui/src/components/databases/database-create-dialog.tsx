import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';

import {
  LocalDatabaseNode,
  LocalDatabaseViewNode,
} from '@colanode/client/types';
import { generateFractionalIndex, generateId, IdType } from '@colanode/core';
import {
  DatabaseForm,
  DatabaseFormValues,
} from '@colanode/ui/components/databases/database-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@colanode/ui/components/ui/dialog';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { database as appDatabase } from '@colanode/ui/data';

interface DatabaseCreateDialogProps {
  spaceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DatabaseCreateDialog = ({
  spaceId,
  open,
  onOpenChange,
}: DatabaseCreateDialogProps) => {
  const workspace = useWorkspace();
  const navigate = useNavigate({ from: '/workspace/$userId' });
  const { mutate, isPending } = useMutation({
    mutationFn: async (values: DatabaseFormValues) => {
      const nodes = appDatabase.workspace(workspace.userId).nodes;

      const databaseId = generateId(IdType.Database);
      const fieldId = generateId(IdType.Field);
      const viewId = generateId(IdType.DatabaseView);

      const database: LocalDatabaseNode = {
        id: databaseId,
        type: 'database',
        attributes: {
          type: 'database',
          name: values.name,
          parentId: spaceId,
          fields: {
            [generateId(IdType.Field)]: {
              id: fieldId,
              type: 'text',
              index: generateFractionalIndex(null, null),
              name: 'Comment',
            },
          },
        },
        parentId: spaceId,
        rootId: spaceId,
        createdAt: new Date().toISOString(),
        createdBy: workspace.userId,
        updatedAt: null,
        updatedBy: null,
        localRevision: '0',
        serverRevision: '0',
      };

      const view: LocalDatabaseViewNode = {
        id: viewId,
        type: 'database_view',
        attributes: {
          type: 'database_view',
          name: 'Default',
          index: generateFractionalIndex(null, null),
          layout: 'table',
          parentId: databaseId,
        },
        parentId: databaseId,
        rootId: databaseId,
        createdAt: new Date().toISOString(),
        createdBy: workspace.userId,
        updatedAt: null,
        updatedBy: null,
        localRevision: '0',
        serverRevision: '0',
      };

      nodes.insert([database, view]);
      return database;
    },
    onSuccess: (database) => {
      navigate({
        to: '$nodeId',
        params: {
          nodeId: database.id,
        },
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create database</DialogTitle>
          <DialogDescription>
            Create a new database to store your data
          </DialogDescription>
        </DialogHeader>
        <DatabaseForm
          id={generateId(IdType.Database)}
          values={{
            name: '',
          }}
          isPending={isPending}
          submitText="Create"
          onCancel={() => {
            onOpenChange(false);
          }}
          onSubmit={(values) => mutate(values)}
        />
      </DialogContent>
    </Dialog>
  );
};
