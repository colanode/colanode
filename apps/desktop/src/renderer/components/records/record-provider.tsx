import React from 'react';
import { RecordContext } from '@/renderer/contexts/record';
import { hasEditorAccess, NodeRole, RecordNode } from '@colanode/core';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useMutation } from '@/renderer/hooks/use-mutation';

export const RecordProvider = ({
  record,
  role,
  children,
}: {
  record: RecordNode;
  role: NodeRole;
  children: React.ReactNode;
}) => {
  const workspace = useWorkspace();
  const { mutate } = useMutation();

  const canEdit =
    record.createdBy === workspace.userId || hasEditorAccess(role);

  return (
    <RecordContext.Provider
      value={{
        id: record.id,
        name: record.attributes.name,
        avatar: record.attributes.avatar,
        fields: record.attributes.fields,
        createdBy: record.createdBy,
        createdAt: record.createdAt,
        updatedBy: record.updatedBy,
        updatedAt: record.updatedAt,
        canEdit,
        updateFieldValue: (field, value) => {
          mutate({
            input: {
              type: 'node_attribute_set',
              nodeId: record.id,
              path: `fields.${field.id}`,
              value,
              userId: workspace.userId,
            },
          });
        },
        removeFieldValue: (field) => {
          mutate({
            input: {
              type: 'node_attribute_delete',
              nodeId: record.id,
              path: `fields.${field.id}`,
              userId: workspace.userId,
            },
          });
        },
        getBooleanValue: (field) => {
          const fieldValue = record.attributes.fields[field.id];
          if (fieldValue?.type === 'boolean') {
            return fieldValue.value;
          }

          return false;
        },
        getCollaboratorValue: (field) => {
          const fieldValue = record.attributes.fields[field.id];
          if (fieldValue?.type === 'collaborator') {
            return fieldValue.value;
          }

          return null;
        },
        getDateValue: (field) => {
          const fieldValue = record.attributes.fields[field.id];
          if (fieldValue?.type === 'date') {
            return new Date(fieldValue.value);
          }

          return null;
        },
        getEmailValue: (field) => {
          const fieldValue = record.attributes.fields[field.id];
          if (fieldValue?.type === 'email') {
            return fieldValue.value;
          }

          return null;
        },
        getFileValue: (field) => {
          const fieldValue = record.attributes.fields[field.id];
          if (fieldValue?.type === 'file') {
            return fieldValue.value;
          }

          return null;
        },
        getMultiSelectValue: (field) => {
          const fieldValue = record.attributes.fields[field.id];
          if (fieldValue?.type === 'multiSelect') {
            return fieldValue.value;
          }

          return [];
        },
        getNumberValue: (field) => {
          const fieldValue = record.attributes.fields[field.id];
          if (fieldValue?.type === 'number') {
            return fieldValue.value;
          }

          return null;
        },
        getPhoneValue: (field) => {
          const fieldValue = record.attributes.fields[field.id];
          if (fieldValue?.type === 'phone') {
            return fieldValue.value;
          }

          return null;
        },
        getRelationValue: (field) => {
          const fieldValue = record.attributes.fields[field.id];
          if (fieldValue?.type === 'relation') {
            return fieldValue.value;
          }

          return null;
        },
        getRollupValue: (field) => {
          const fieldValue = record.attributes.fields[field.id];
          if (fieldValue?.type === 'rollup') {
            return fieldValue.value;
          }

          return null;
        },
        getSelectValue: (field) => {
          const fieldValue = record.attributes.fields[field.id];
          if (fieldValue?.type === 'select') {
            return fieldValue.value;
          }

          return null;
        },
        getTextValue: (field) => {
          const fieldValue = record.attributes.fields[field.id];
          if (fieldValue?.type === 'text') {
            return fieldValue.value;
          }

          return null;
        },
        getUrlValue: (field) => {
          const fieldValue = record.attributes.fields[field.id];
          if (fieldValue?.type === 'url') {
            return fieldValue.value;
          }

          return null;
        },
        transactionId: record.transactionId,
      }}
    >
      {children}
    </RecordContext.Provider>
  );
};
