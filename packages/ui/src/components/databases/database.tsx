import { ReactNode, useCallback } from 'react';

import { LocalDatabaseNode } from '@colanode/client/types';
import { NodeRole, hasNodeRole } from '@colanode/core';
import { DatabaseContext } from '@colanode/ui/contexts/database';
import { useWorkspace } from '@colanode/ui/contexts/workspace';

interface DatabaseProps {
  database: LocalDatabaseNode;
  role: NodeRole;
  children: ReactNode;
}

export const Database = ({ database, role, children }: DatabaseProps) => {
  const workspace = useWorkspace();

  const purpose = database.purpose ?? 'records';
  const isMetaType = purpose === 'meta_type';
  const canEdit = hasNodeRole(role, 'editor');
  const isLocked = database.locked ?? false;
  const canCreateRecord = hasNodeRole(role, 'editor') && !isMetaType;
  const canCreatePage = hasNodeRole(role, 'editor') && isMetaType;

  const toggleLock = useCallback(() => {
    if (!canEdit) {
      return;
    }

    const nodes = workspace.collections.nodes;
    nodes.update(database.id, (draft) => {
      if (draft.type !== 'database') {
        return;
      }

      const currentLocked = draft.locked ?? false;
      draft.locked = !currentLocked;
    });
  }, [canEdit, database.id, workspace.userId]);

  return (
    <DatabaseContext.Provider
      value={{
        id: database.id,
        name: database.name,
        nameField: database.nameField,
        role,
        fields: Object.values(database.fields),
        purpose,
        canEdit: canEdit,
        isLocked,
        canCreateRecord,
        canCreatePage,
        rootId: database.rootId,
        toggleLock,
      }}
    >
      {children}
    </DatabaseContext.Provider>
  );
};
