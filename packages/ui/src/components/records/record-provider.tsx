import { toast } from 'sonner';

import { LocalRecordNode } from '@colanode/client/types';
import { NodeRole, hasNodeRole } from '@colanode/core';
import { RecordContext } from '@colanode/ui/contexts/record';
import { useWorkspace } from '@colanode/ui/contexts/workspace';

export const RecordProvider = ({
  record,
  role,
  children,
}: {
  record: LocalRecordNode;
  role: NodeRole;
  children: React.ReactNode;
}) => {
  const workspace = useWorkspace();

  const canEdit =
    record.createdBy === workspace.userId || hasNodeRole(role, 'editor');

  return (
    <RecordContext.Provider
      value={{
        id: record.id,
        name: record.name,
        avatar: record.avatar,
        fields: record.fields,
        createdBy: record.createdBy,
        createdAt: record.createdAt,
        updatedBy: record.updatedBy,
        updatedAt: record.updatedAt,
        databaseId: record.databaseId,
        localRevision: record.localRevision,
        canEdit,
        updateFieldValue: async (field, value) => {
          const result = await window.colanode.executeMutation({
            type: 'record.field.value.set',
            recordId: record.id,
            fieldId: field.id,
            value,
            userId: workspace.userId,
          });

          if (!result.success) {
            toast.error(result.error.message);
          }
        },
        removeFieldValue: async (field) => {
          const result = await window.colanode.executeMutation({
            type: 'record.field.value.delete',
            recordId: record.id,
            fieldId: field.id,
            userId: workspace.userId,
          });

          if (!result.success) {
            toast.error(result.error.message);
          }
        },
        getBooleanValue: (field) => {
          const fieldValue = record.fields[field.id];
          if (fieldValue?.type === 'boolean') {
            return fieldValue.value;
          }

          return false;
        },
        getCollaboratorValue: (field) => {
          const fieldValue = record.fields[field.id];
          if (fieldValue?.type === 'string_array') {
            return fieldValue.value;
          }

          return null;
        },
        getDateValue: (field) => {
          const fieldValue = record.fields[field.id];
          if (fieldValue?.type === 'string') {
            return new Date(fieldValue.value);
          }

          return null;
        },
        getEmailValue: (field) => {
          const fieldValue = record.fields[field.id];
          if (fieldValue?.type === 'string') {
            return fieldValue.value;
          }

          return null;
        },
        getFileValue: (field) => {
          const fieldValue = record.fields[field.id];
          if (fieldValue?.type === 'string_array') {
            return fieldValue.value;
          }

          return null;
        },
        getMultiSelectValue: (field) => {
          const fieldValue = record.fields[field.id];
          if (fieldValue?.type === 'string_array') {
            return fieldValue.value;
          }

          return [];
        },
        getNumberValue: (field) => {
          const fieldValue = record.fields[field.id];
          if (fieldValue?.type === 'number') {
            return fieldValue.value;
          }

          return null;
        },
        getPhoneValue: (field) => {
          const fieldValue = record.fields[field.id];
          if (fieldValue?.type === 'string') {
            return fieldValue.value;
          }

          return null;
        },
        getRelationValue: (field) => {
          const fieldValue = record.fields[field.id];
          if (fieldValue?.type === 'string_array') {
            return fieldValue.value;
          }

          return null;
        },
        getRollupValue: (field) => {
          const fieldValue = record.fields[field.id];
          if (fieldValue?.type === 'string') {
            return fieldValue.value;
          }

          return null;
        },
        getSelectValue: (field) => {
          const fieldValue = record.fields[field.id];
          if (fieldValue?.type === 'string') {
            return fieldValue.value;
          }

          return null;
        },
        getTextValue: (field) => {
          const fieldValue = record.fields[field.id];
          if (fieldValue?.type === 'text') {
            return fieldValue.value;
          }

          return null;
        },
        getUrlValue: (field) => {
          const fieldValue = record.fields[field.id];
          if (fieldValue?.type === 'string') {
            return fieldValue.value;
          }

          return null;
        },
      }}
    >
      {children}
    </RecordContext.Provider>
  );
};
