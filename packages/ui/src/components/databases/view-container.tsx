import { eq, useLiveQuery } from '@tanstack/react-db';
import { useNavigate } from '@tanstack/react-router';

import {
  LocalDatabaseNode,
  LocalDatabaseViewNode,
} from '@colanode/client/types';
import { NodeRole } from '@colanode/core';
import { Database } from '@colanode/ui/components/databases/database';
import { DatabaseViews } from '@colanode/ui/components/databases/database-views';
import { useWorkspace } from '@colanode/ui/contexts/workspace';

interface ViewContainerProps {
  view: LocalDatabaseViewNode;
  role: NodeRole;
}

export const ViewContainer = ({ view, role }: ViewContainerProps) => {
  const workspace = useWorkspace();
  const navigate = useNavigate();
  const databaseQuery = useLiveQuery(
    (q) =>
      q
        .from({ nodes: workspace.collections.nodes })
        .where(({ nodes }) => eq(nodes.id, view.parentId))
        .findOne(),
    [workspace.userId, view.parentId]
  );

  if (!databaseQuery.data) {
    return null;
  }

  const database = databaseQuery.data as LocalDatabaseNode;
  return (
    <Database database={database} role={role}>
      <DatabaseViews
        viewId={view.id}
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
