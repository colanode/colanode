import {
  DatabaseNode,
  hasCollaboratorAccess,
  hasEditorAccess,
  NodeRole,
} from '@colanode/core';
import React from 'react';

import { DatabaseContext } from '@/renderer/contexts/database';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useMutation } from '@/renderer/hooks/use-mutation';
import { toast } from '@/renderer/hooks/use-toast';

interface DatabaseProps {
  database: DatabaseNode;
  role: NodeRole;
  children: React.ReactNode;
}

export const Database = ({ database, role, children }: DatabaseProps) => {
  const workspace = useWorkspace();
  const { mutate } = useMutation();

  const canEdit = hasEditorAccess(role);
  const canCreateRecord = hasCollaboratorAccess(role);

  return (
    <DatabaseContext.Provider
      value={{
        id: database.id,
        name: database.attributes.name,
        role,
        fields: Object.values(database.attributes.fields),
        views: Object.values(database.attributes.views),
        canEdit,
        canCreateRecord,
        createField: (type, name) => {
          if (!canEdit) {
            return;
          }

          mutate({
            input: {
              type: 'field_create',
              databaseId: database.id,
              name,
              fieldType: type,
              userId: workspace.userId,
            },
            onError(error) {
              toast({
                title: 'Failed to create field',
                description: error.message,
                variant: 'destructive',
              });
            },
          });
        },
        renameField: (id, name) => {
          if (!canEdit) {
            return;
          }

          mutate({
            input: {
              type: 'field_name_update',
              databaseId: database.id,
              fieldId: id,
              name,
              userId: workspace.userId,
            },
            onError(error) {
              toast({
                title: 'Failed to update field',
                description: error.message,
                variant: 'destructive',
              });
            },
          });
        },
        deleteField: (id) => {
          if (!canEdit) {
            return;
          }

          mutate({
            input: {
              type: 'field_delete',
              databaseId: database.id,
              fieldId: id,
              userId: workspace.userId,
            },
            onError(error) {
              toast({
                title: 'Failed to delete field',
                description: error.message,
                variant: 'destructive',
              });
            },
          });
        },
        createSelectOption: (fieldId, name, color) => {
          if (!canEdit) {
            return;
          }

          mutate({
            input: {
              type: 'select_option_create',
              databaseId: database.id,
              fieldId,
              name,
              color,
              userId: workspace.userId,
            },
            onError(error) {
              toast({
                title: 'Failed to create select option',
                description: error.message,
                variant: 'destructive',
              });
            },
          });
        },
        updateSelectOption: (fieldId, attributes) => {
          if (!canEdit) {
            return;
          }

          mutate({
            input: {
              type: 'select_option_update',
              databaseId: database.id,
              fieldId,
              optionId: attributes.id,
              name: attributes.name,
              color: attributes.color,
              userId: workspace.userId,
            },
            onError(error) {
              toast({
                title: 'Failed to update select option',
                description: error.message,
                variant: 'destructive',
              });
            },
          });
        },
        deleteSelectOption: (fieldId, optionId) => {
          if (!canEdit) {
            return;
          }

          mutate({
            input: {
              type: 'select_option_delete',
              databaseId: database.id,
              fieldId,
              optionId,
              userId: workspace.userId,
            },
            onError(error) {
              toast({
                title: 'Failed to delete select option',
                description: error.message,
                variant: 'destructive',
              });
            },
          });
        },
      }}
    >
      {children}
    </DatabaseContext.Provider>
  );
};
