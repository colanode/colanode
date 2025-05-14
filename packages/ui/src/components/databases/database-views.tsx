import React from 'react';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import { View } from '@colanode/ui/components/databases/view';
import { ScrollBar } from '@colanode/ui/components/ui/scroll-area';
import { useDatabase } from '@colanode/ui/contexts/database';
import { DatabaseViewsContext } from '@colanode/ui/contexts/database-views';
import { useQuery } from '@colanode/ui/hooks/use-query';
import { useWorkspace } from '@colanode/ui/contexts/workspace';

export const DatabaseViews = () => {
  const workspace = useWorkspace();
  const database = useDatabase();
  const [activeViewId, setActiveViewId] = React.useState<string | null>(null);

  const { data } = useQuery({
    type: 'database_view_list',
    accountId: workspace.accountId,
    workspaceId: workspace.id,
    databaseId: database.id,
  });

  const views = data ?? [];
  const activeView = views.find((view) => view.id === activeViewId);

  React.useEffect(() => {
    if (views.length > 0 && !views.some((view) => view.id === activeViewId)) {
      setActiveViewId(views[0]?.id ?? null);
    }
  }, [views, activeViewId]);

  return (
    <DatabaseViewsContext.Provider
      value={{ views, activeViewId: activeViewId ?? '', setActiveViewId }}
    >
      <div className="h-full w-full overflow-y-auto">
        <ScrollAreaPrimitive.Root className="relative overflow-hidden">
          <ScrollAreaPrimitive.Viewport className="group/database h-full max-h-[calc(100vh-100px)] w-full overflow-y-auto rounded-[inherit]">
            {activeView && <View view={activeView} />}
          </ScrollAreaPrimitive.Viewport>
          <ScrollBar orientation="horizontal" />
          <ScrollBar orientation="vertical" />
          <ScrollAreaPrimitive.Corner />
        </ScrollAreaPrimitive.Root>
      </div>
    </DatabaseViewsContext.Provider>
  );
};
