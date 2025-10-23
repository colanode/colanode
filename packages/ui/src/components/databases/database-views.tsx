import { eq, useLiveQuery } from '@tanstack/react-db';
import { useEffect, useState } from 'react';

import { LocalDatabaseViewNode } from '@colanode/client/types';
import { View } from '@colanode/ui/components/databases/view';
import { useDatabase } from '@colanode/ui/contexts/database';
import { DatabaseViewsContext } from '@colanode/ui/contexts/database-views';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { database as appDatabase } from '@colanode/ui/data';

interface DatabaseViewsProps {
  inline?: boolean;
}

export const DatabaseViews = ({ inline = false }: DatabaseViewsProps) => {
  const workspace = useWorkspace();
  const database = useDatabase();
  const [activeViewId, setActiveViewId] = useState<string | null>(null);

  const viewListQuery = useLiveQuery((q) =>
    q
      .from({ nodes: appDatabase.workspace(workspace.userId).nodes })
      .where(({ nodes }) => eq(nodes.type, 'database_view'))
      .where(({ nodes }) => eq(nodes.parentId, database.id))
  );

  const views =
    viewListQuery.data.map((node) => node as LocalDatabaseViewNode) ?? [];
  const activeView = views.find((view) => view.id === activeViewId);

  useEffect(() => {
    if (views.length > 0 && !views.some((view) => view.id === activeViewId)) {
      setActiveViewId(views[0]?.id ?? null);
    }
  }, [views, activeViewId]);

  return (
    <DatabaseViewsContext.Provider
      value={{
        views,
        activeViewId: activeViewId ?? '',
        setActiveViewId,
        inline,
      }}
    >
      {activeView && <View view={activeView} />}
    </DatabaseViewsContext.Provider>
  );
};
