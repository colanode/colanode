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
          });
        },
        renameField: (id, name) => {
          if (!canEdit) {
            return;
          }

          mutate({
            input: {
              type: 'node_attribute_set',
              nodeId: database.id,
              path: `fields.${id}.name`,
              value: name,
              userId: workspace.userId,
            },
          });
        },
        deleteField: (id) => {
          if (!canEdit) {
            return;
          }

          mutate({
            input: {
              type: 'node_attribute_delete',
              nodeId: database.id,
              path: `fields.${id}`,
              userId: workspace.userId,
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
          });
        },
        updateSelectOption: (fieldId, attributes) => {
          if (!canEdit) {
            return;
          }

          mutate({
            input: {
              type: 'node_attribute_set',
              nodeId: database.id,
              path: `fields.${fieldId}.options.${attributes.id}`,
              value: attributes,
              userId: workspace.userId,
            },
          });
        },
        deleteSelectOption: (fieldId, optionId) => {
          if (!canEdit) {
            return;
          }

          mutate({
            input: {
              type: 'node_attribute_delete',
              nodeId: database.id,
              path: `fields.${fieldId}.options.${optionId}`,
              userId: workspace.userId,
            },
          });
        },
      }}
    >
      {children}
    </DatabaseContext.Provider>
  );
};
