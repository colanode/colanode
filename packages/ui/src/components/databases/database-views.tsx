import { eq, useLiveQuery } from '@tanstack/react-db';
import type { ReactNode } from 'react';

import { LocalDatabaseViewNode } from '@colanode/client/types';
import { View } from '@colanode/ui/components/databases/view';
import { useDatabase } from '@colanode/ui/contexts/database';
import { DatabaseViewsContext } from '@colanode/ui/contexts/database-views';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useMetadata } from '@colanode/ui/hooks/use-metadata';

interface DatabaseViewsProps {
  inline?: boolean;
  renderLayout?: (props: {
    view: LocalDatabaseViewNode;
    inline: boolean;
  }) => ReactNode;
}

export const DatabaseViews = ({
  inline = false,
  renderLayout,
}: DatabaseViewsProps) => {
  const workspace = useWorkspace();
  const database = useDatabase();

  const [activeViewId, setActiveViewId] = useMetadata<string>(
    workspace.userId,
    `${database.id}.activeViewId`
  );

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
  const activeView = views.find((view) => view.id === activeViewId) ?? views[0];

  return (
    <DatabaseViewsContext.Provider
      value={{
        views,
        activeViewId: activeView?.id ?? '',
        onActiveViewChange: setActiveViewId,
        inline,
      }}
    >
      {activeView &&
        (renderLayout
          ? renderLayout({ view: activeView, inline })
          : <View view={activeView} />)}
    </DatabaseViewsContext.Provider>
  );
};
