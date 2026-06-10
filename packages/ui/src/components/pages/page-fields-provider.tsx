import { LocalPageNode } from '@colanode/client/types';
import { NodeRole, hasNodeRole } from '@colanode/core';
import { EntityFieldsContext } from '@colanode/ui/contexts/entity-fields';
import { RecordContext } from '@colanode/ui/contexts/record';
import { useWorkspace } from '@colanode/ui/contexts/workspace';

export const PageFieldsProvider = ({
  page,
  role,
  children,
}: {
  page: LocalPageNode;
  role: NodeRole;
  children: React.ReactNode;
}) => {
  const workspace = useWorkspace();
  const canEdit =
    page.createdBy === workspace.userId || hasNodeRole(role, 'editor');

  return (
    <EntityFieldsContext.Provider
      value={{
        entityType: 'page',
        id: page.id,
        fields: page.fields ?? {},
        canEdit,
      }}
    >
      <RecordContext.Provider
        value={{
          id: page.id,
          name: page.name,
          avatar: page.avatar,
          fields: page.fields ?? {},
          createdBy: page.createdBy,
          createdAt: page.createdAt,
          updatedBy: page.updatedBy,
          updatedAt: page.updatedAt,
          databaseId: page.metaTypeId,
          localRevision: page.localRevision,
          canEdit,
        }}
      >
        {children}
      </RecordContext.Provider>
    </EntityFieldsContext.Provider>
  );
};
