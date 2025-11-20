import { eq, useLiveQuery } from '@tanstack/react-db';

import { LocalDatabaseNode } from '@colanode/client/types';
import { NodeRole } from '@colanode/core';
import { collections } from '@colanode/ui/collections';
import { Database } from '@colanode/ui/components/databases/database';
import { useWorkspace } from '@colanode/ui/contexts/workspace';

interface RecordDatabaseProps {
  id: string;
  role: NodeRole;
  children: React.ReactNode;
}

export const RecordDatabase = ({ id, role, children }: RecordDatabaseProps) => {
  const workspace = useWorkspace();

  const databaseGetQuery = useLiveQuery(
    (q) =>
      q
        .from({ databases: collections.workspace(workspace.userId).databases })
        .where(({ databases }) => eq(databases.id, id))
        .findOne(),
    [workspace.userId, id]
  );

  if (databaseGetQuery.isLoading) {
    return null;
  }

  if (!databaseGetQuery.data) {
    return null;
  }

  const database = databaseGetQuery.data as LocalDatabaseNode;
  return (
    <Database database={database} role={role}>
      {children}
    </Database>
  );
};
