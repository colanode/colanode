import React from 'react';
import { toast } from 'sonner';

import { LocalDatabaseNode } from '@colanode/client/types';
import { NodeRole, hasNodeRole } from '@colanode/core';
import { DatabaseContext } from '@colanode/ui/contexts/database';
import { useWorkspace } from '@colanode/ui/contexts/workspace';

interface DatabaseProps {
  database: LocalDatabaseNode;
  role: NodeRole;
  children: React.ReactNode;
}

export const Database = ({ database, role, children }: DatabaseProps) => {
  const workspace = useWorkspace();
  const canEdit = hasNodeRole(role, 'editor');
  const canCreateRecord = hasNodeRole(role, 'editor');

  return (
    <DatabaseContext.Provider
      value={{
        id: database.id,
        name: database.attributes.name,
        role,
        fields: Object.values(database.attributes.fields),
        canEdit,
        canCreateRecord,
        createField: async (type, name) => {
          if (!canEdit) return;

          const result = await window.colanode.executeMutation({
            type: 'field_create',
            databaseId: database.id,
            name,
            fieldType: type,
            accountId: workspace.accountId,
            workspaceId: workspace.id,
          });

          if (!result.success) {
            toast.error(result.error.message);
          }
        },
        renameField: async (id, name) => {
          if (!canEdit) return;

          const result = await window.colanode.executeMutation({
            type: 'field_name_update',
            databaseId: database.id,
            fieldId: id,
            name,
            accountId: workspace.accountId,
            workspaceId: workspace.id,
          });

          if (!result.success) {
            toast.error(result.error.message);
          }
        },
        deleteField: async (id) => {
          if (!canEdit) return;

          const result = await window.colanode.executeMutation({
            type: 'field_delete',
            databaseId: database.id,
            fieldId: id,
            accountId: workspace.accountId,
            workspaceId: workspace.id,
          });

          if (!result.success) {
            toast.error(result.error.message);
          }
        },
        createSelectOption: async (fieldId, name, color) => {
          if (!canEdit) return;

          const result = await window.colanode.executeMutation({
            type: 'select_option_create',
            databaseId: database.id,
            fieldId,
            name,
            color,
            accountId: workspace.accountId,
            workspaceId: workspace.id,
          });

          if (!result.success) {
            toast.error(result.error.message);
          }
        },
        updateSelectOption: async (fieldId, attributes) => {
          if (!canEdit) return;

          const result = await window.colanode.executeMutation({
            type: 'select_option_update',
            databaseId: database.id,
            fieldId,
            optionId: attributes.id,
            name: attributes.name,
            color: attributes.color,
            accountId: workspace.accountId,
            workspaceId: workspace.id,
          });

          if (!result.success) {
            toast.error(result.error.message);
          }
        },
        deleteSelectOption: async (fieldId, optionId) => {
          if (!canEdit) return;

          const result = await window.colanode.executeMutation({
            type: 'select_option_delete',
            databaseId: database.id,
            fieldId,
            optionId,
            accountId: workspace.accountId,
            workspaceId: workspace.id,
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
