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
      }}
    >
      {children}
    </RecordContext.Provider>
  );
};
