import { EntryRole, RecordEntry, hasEntryRole } from '@colanode/core';
import React from 'react';

import { RecordContext } from '@/renderer/contexts/record';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { toast } from '@/renderer/hooks/use-toast';

export const RecordProvider = ({
  record,
  role,
  children,
}: {
  record: RecordEntry;
  role: EntryRole;
  children: React.ReactNode;
}) => {
  const workspace = useWorkspace();

  const canEdit =
    record.createdBy === workspace.userId || hasEntryRole(role, 'editor');

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
        databaseId: record.attributes.databaseId,
        canEdit,
        updateFieldValue: async (field, value) => {
          const result = await window.colanode.executeMutation({
            type: 'record_field_value_set',
            recordId: record.id,
            fieldId: field.id,
            value,
            accountId: workspace.accountId,
            workspaceId: workspace.id,
          });

          if (!result.success) {
            toast({
              title: 'Failed to update record field value',
              description: result.error.message,
              variant: 'destructive',
            });
          }
        },
        removeFieldValue: async (field) => {
          const result = await window.colanode.executeMutation({
            type: 'record_field_value_delete',
            recordId: record.id,
            fieldId: field.id,
            accountId: workspace.accountId,
            workspaceId: workspace.id,
          });

          if (!result.success) {
            toast({
              title: 'Failed to delete record field value',
              description: result.error.message,
              variant: 'destructive',
            });
          }
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
