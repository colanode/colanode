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
import { useMetaTypeDatabases } from '@colanode/ui/hooks/use-meta-type-databases';
import { useWorkspace } from '@colanode/ui/contexts/workspace';

interface MetaTypeCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MetaTypeCreateDialog = ({
  open,
  onOpenChange,
}: MetaTypeCreateDialogProps) => {
  const workspace = useWorkspace();
  const navigate = useNavigate({ from: '/workspace/$userId' });
  const { defaultPageMetaType } = useMetaTypeDatabases();

  const parentSpaceId =
    defaultPageMetaType?.parentId ??
    defaultPageMetaType?.rootId ??
    workspace.userId;

  const { mutate } = useMutation({
    mutationFn: async (values: DatabaseFormValues) => {
      const nodes = workspace.collections.nodes;
      const databaseId = generateId(IdType.Database);
      const viewId = generateId(IdType.DatabaseView);

      const database: LocalDatabaseNode = {
        id: databaseId,
        type: 'database',
        name: values.name,
        parentId: parentSpaceId,
        purpose: 'meta_type',
        fields: {},
        rootId: parentSpaceId,
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
        name: 'Default',
        index: generateFractionalIndex(null, null),
        layout: 'table',
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
        params: { nodeId: database.id },
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
          <DialogTitle>Create meta type</DialogTitle>
          <DialogDescription>
            Define a new page meta type with custom properties.
          </DialogDescription>
        </DialogHeader>
        <DatabaseForm
          id={generateId(IdType.Database)}
          values={{ name: '' }}
          submitText="Create"
          onCancel={() => onOpenChange(false)}
          onSubmit={(values) => mutate(values)}
        />
      </DialogContent>
    </Dialog>
  );
};
