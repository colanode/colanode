import { useEffect, useState } from 'react';

import { View } from '@colanode/ui/components/databases/view';
import {
  ScrollArea,
  ScrollBar,
  ScrollViewport,
} from '@colanode/ui/components/ui/scroll-area';
import { useDatabase } from '@colanode/ui/contexts/database';
import { DatabaseViewsContext } from '@colanode/ui/contexts/database-views';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useLiveQuery } from '@colanode/ui/hooks/use-live-query';

interface DatabaseViewsProps {
  inline?: boolean;
}

export const DatabaseViews = ({ inline = false }: DatabaseViewsProps) => {
  const workspace = useWorkspace();
  const database = useDatabase();
  const [activeViewId, setActiveViewId] = useState<string | null>(null);

  const databaseViewListQuery = useLiveQuery({
    type: 'database.view.list',
    accountId: workspace.accountId,
    workspaceId: workspace.id,
    databaseId: database.id,
  });

  const views = databaseViewListQuery.data ?? [];
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
      <ScrollArea className="relative overflow-hidden">
        <ScrollViewport className="group/database h-full max-h-[calc(100vh-100px)] w-full overflow-y-auto rounded-[inherit]">
          {activeView && <View view={activeView} />}
        </ScrollViewport>
        <ScrollBar orientation="horizontal" />
        <ScrollBar orientation="vertical" />
      </ScrollArea>
    </DatabaseViewsContext.Provider>
  );
};
