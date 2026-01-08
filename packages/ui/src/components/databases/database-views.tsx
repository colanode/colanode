import { eq, useLiveQuery } from '@tanstack/react-db';

import { LocalDatabaseViewNode } from '@colanode/client/types';
import { View } from '@colanode/ui/components/databases/view';
import { useDatabase } from '@colanode/ui/contexts/database';
import { DatabaseViewsContext } from '@colanode/ui/contexts/database-views';
import { useWorkspace } from '@colanode/ui/contexts/workspace';

interface DatabaseViewsProps {
  inline?: boolean;
  viewId?: string;
  onViewChange: (viewId: string) => void;
}

export const DatabaseViews = ({
  inline = false,
  viewId,
  onViewChange,
}: DatabaseViewsProps) => {
  const workspace = useWorkspace();
  const database = useDatabase();

  const databaseViewListQuery = useLiveQuery(
    (q) =>
      q
        .from({ nodes: workspace.collections.nodes })
        .where(({ nodes }) => eq(nodes.type, 'database_view'))
        .where(({ nodes }) => eq(nodes.parentId, database.id))
        .orderBy(
          ({ nodes }) => (nodes as unknown as LocalDatabaseViewNode).index,
          'asc'
        ),
    [workspace.userId, database.id]
  );

  const views = databaseViewListQuery.data.map(
    (node) => node as LocalDatabaseViewNode
  );
  const activeView = views.find((view) => view.id === viewId) ?? views[0];

  return (
    <DatabaseViewsContext.Provider
      value={{
        views,
        viewId: activeView?.id ?? '',
        onViewChange,
        inline,
      }}
    >
      {activeView && <View view={activeView} />}
    </DatabaseViewsContext.Provider>
  );
};
