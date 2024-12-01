import React from 'react';

import { View } from '@/renderer/components/databases/view';
import { ScrollArea } from '@/renderer/components/ui/scroll-area';
import { useDatabase } from '@/renderer/contexts/database';
import { DatabaseViewsContext } from '@/renderer/contexts/database-views';

export const DatabaseViews = () => {
  const database = useDatabase();
  const [activeViewId, setActiveViewId] = React.useState<string>(
    database.views[0]?.id ?? ''
  );
  const activeView = database.views.find((view) => view.id === activeViewId);

  React.useEffect(() => {
    if (!activeView) {
      setActiveViewId(database.views[0]?.id ?? '');
    }
  }, [database.views, activeViewId]);

  return (
    <DatabaseViewsContext.Provider
      value={{ views: database.views, activeViewId, setActiveViewId }}
    >
      <ScrollArea className="group/database h-full max-h-full w-full overflow-y-auto px-10 pb-12">
        {activeView && <View view={activeView} />}
      </ScrollArea>
    </DatabaseViewsContext.Provider>
  );
};
