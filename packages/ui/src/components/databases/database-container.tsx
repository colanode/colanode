import { LocalDatabaseNode } from '@colanode/client/types';
import { NodeRole } from '@colanode/core';
import { Database } from '@colanode/ui/components/databases/database';
import { DatabaseViews } from '@colanode/ui/components/databases/database-views';

interface DatabaseContainerProps {
  database: LocalDatabaseNode;
  role: NodeRole;
}

export const DatabaseContainer = ({
  database,
  role,
}: DatabaseContainerProps) => {
  return (
    <Database database={database} role={role}>
      <DatabaseViews />
    </Database>
  );
};
