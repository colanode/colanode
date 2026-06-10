import { LocalDatabaseNode } from '@colanode/client/types';
import { NodeRole, hasNodeRole } from '@colanode/core';
import { Database } from '@colanode/ui/components/databases/database';
import { DatabaseViews } from '@colanode/ui/components/databases/database-views';
import { NodeTagBar } from '@colanode/ui/components/nodes/node-tag-bar';

interface DatabaseContainerProps {
  database: LocalDatabaseNode;
  role: NodeRole;
}

export const DatabaseContainer = ({
  database,
  role,
}: DatabaseContainerProps) => {
  const canEdit = hasNodeRole(role, 'editor');

  return (
    <div className="flex h-full min-h-0 flex-col">
      <NodeTagBar node={database} canEdit={canEdit} />
      <div className="min-h-0 flex-1">
        <Database database={database} role={role}>
          <DatabaseViews />
        </Database>
      </div>
    </div>
  );
};
