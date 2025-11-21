import { ReactNode } from 'react';
import { toast } from 'sonner';

import { LocalDatabaseNode } from '@colanode/client/types';
import { NodeRole, hasNodeRole } from '@colanode/core';
import { DatabaseContext } from '@colanode/ui/contexts/database';
import { useWorkspace } from '@colanode/ui/contexts/workspace';

interface DatabaseProps {
  database: LocalDatabaseNode;
  role: NodeRole;
  children: ReactNode;
}

export const Database = ({ database, role, children }: DatabaseProps) => {
  const workspace = useWorkspace();
  const canEdit = hasNodeRole(role, 'editor');
  const canCreateRecord = hasNodeRole(role, 'editor');

  return (
    <DatabaseContext.Provider
      value={{
        id: database.id,
        name: database.name,
        nameField: database.nameField,
        role,
        fields: Object.values(database.fields),
        canEdit,
        canCreateRecord,
        rootId: database.rootId,
        createSelectOption: async (fieldId, name, color) => {
          if (!canEdit) return;

          const result = await window.colanode.executeMutation({
            type: 'select.option.create',
            databaseId: database.id,
            fieldId,
            name,
            color,
            userId: workspace.userId,
          });

          if (!result.success) {
            toast.error(result.error.message);
          }
        },
        updateSelectOption: async (fieldId, attributes) => {
          if (!canEdit) return;

          const result = await window.colanode.executeMutation({
            type: 'select.option.update',
            databaseId: database.id,
            fieldId,
            optionId: attributes.id,
            name: attributes.name,
            color: attributes.color,
            userId: workspace.userId,
          });

          if (!result.success) {
            toast.error(result.error.message);
          }
        },
        deleteSelectOption: async (fieldId, optionId) => {
          if (!canEdit) return;

          const result = await window.colanode.executeMutation({
            type: 'select.option.delete',
            databaseId: database.id,
            fieldId,
            optionId,
            userId: workspace.userId,
          });

          if (!result.success) {
            toast.error(result.error.message);
          }
        },
      }}
    >
      {children}
    </DatabaseContext.Provider>
  );
};
