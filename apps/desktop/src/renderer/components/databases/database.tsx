import { NodeRole, hasNodeRole } from '@colanode/core';
import React from 'react';
import { LocalDatabaseNode } from '@colanode/client/types';

import { DatabaseContext } from '@/renderer/contexts/database';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { toast } from '@/renderer/hooks/use-toast';

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
            toast({
              title: 'Failed to create field',
              description: result.error.message,
              variant: 'destructive',
            });
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
            toast({
              title: 'Failed to update field',
              description: result.error.message,
              variant: 'destructive',
            });
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
            toast({
              title: 'Failed to delete field',
              description: result.error.message,
              variant: 'destructive',
            });
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
            toast({
              title: 'Failed to create select option',
              description: result.error.message,
              variant: 'destructive',
            });
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
            toast({
              title: 'Failed to update select option',
              description: result.error.message,
              variant: 'destructive',
            });
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
            toast({
              title: 'Failed to delete select option',
              description: result.error.message,
              variant: 'destructive',
            });
          }
        },
      }}
    >
      {children}
    </DatabaseContext.Provider>
  );
};
