import { eq, useLiveQuery } from '@tanstack/react-db';
import { useEffect, useState } from 'react';

import { collections } from '@colanode/ui/collections';
import { View } from '@colanode/ui/components/databases/view';
import { useDatabase } from '@colanode/ui/contexts/database';
import { DatabaseViewsContext } from '@colanode/ui/contexts/database-views';
import { useWorkspace } from '@colanode/ui/contexts/workspace';

interface DatabaseViewsProps {
  inline?: boolean;
}

export const DatabaseViews = ({ inline = false }: DatabaseViewsProps) => {
  const workspace = useWorkspace();
  const database = useDatabase();
  const [activeViewId, setActiveViewId] = useState<string | null>(null);

  const databaseViewListQuery = useLiveQuery((q) =>
    q
      .from({ views: collections.workspace(workspace.userId).views })
      .where(({ views }) => eq(views.attributes.parentId, database.id))
      .orderBy(({ views }) => views.attributes.index, 'asc')
  );

  const views = databaseViewListQuery.data;
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
