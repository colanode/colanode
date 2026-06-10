import { LocalRecordNode } from '@colanode/client/types';
import { NodeRole, hasNodeRole } from '@colanode/core';
import { EntityFieldsContext } from '@colanode/ui/contexts/entity-fields';
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

  const entityValue = {
    entityType: 'record' as const,
    id: record.id,
    name: record.name,
    avatar: record.avatar,
    fields: record.fields,
    createdBy: record.createdBy,
    createdAt: record.createdAt,
    updatedBy: record.updatedBy,
    updatedAt: record.updatedAt,
    schemaId: record.databaseId,
    localRevision: record.localRevision,
    canEdit,
  };

  return (
    <EntityFieldsContext.Provider value={entityValue}>
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
        }}
      >
        {children}
      </RecordContext.Provider>
    </EntityFieldsContext.Provider>
  );
};
