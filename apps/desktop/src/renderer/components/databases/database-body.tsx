import { DatabaseNode, NodeRole } from '@colanode/core';

import { Database } from '@/renderer/components/databases/database';
import { DatabaseViews } from '@/renderer/components/databases/database-views';

interface DatabaseBodyProps {
  database: DatabaseNode;
  role: NodeRole;
}

export const DatabaseBody = ({ database, role }: DatabaseBodyProps) => {
  return (
    <Database database={database} role={role}>
      <DatabaseViews />
    </Database>
  );
};
