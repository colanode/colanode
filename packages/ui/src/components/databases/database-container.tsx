import { useNavigate } from '@tanstack/react-router';

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
  const navigate = useNavigate();

  return (
    <Database database={database} role={role}>
      <DatabaseViews
        onViewChange={(viewId) => {
          navigate({
            from: '/workspace/$userId',
            to: '$nodeId',
            params: {
              nodeId: viewId,
            },
          });
        }}
      />
    </Database>
  );
};
