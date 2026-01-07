import { ReactNode } from 'react';

import { LocalDatabaseNode } from '@colanode/client/types';
import { NodeRole, hasNodeRole } from '@colanode/core';
import { DatabaseContext } from '@colanode/ui/contexts/database';

interface DatabaseProps {
  database: LocalDatabaseNode;
  role: NodeRole;
  children: ReactNode;
}

export const Database = ({ database, role, children }: DatabaseProps) => {
  const canEdit = hasNodeRole(role, 'editor');
  const canCreateRecord = hasNodeRole(role, 'editor');

  return (
    <DatabaseContext.Provider
      value={{
        id: database.id,
        name: database.name,
        nameField: database.nameField,
        role,
        fields: Object.values(database.fields),
        canEdit,
        canCreateRecord,
        rootId: database.rootId,
      }}
    >
      {children}
    </DatabaseContext.Provider>
  );
};
