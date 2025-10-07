import { useLiveQuery } from '@tanstack/react-db';

import { TabsContentItem } from '@colanode/ui/components/layouts/tabs/tabs-content-item';
import { database } from '@colanode/ui/data';

export const TabsContent = () => {
  const tabsQuery = useLiveQuery((q) =>
    q
      .from({ tabs: database.tabs })
      .orderBy(({ tabs }) => tabs.index, `asc`)
      .select(({ tabs }) => ({
        id: tabs.id,
      }))
  );

  const tabs = tabsQuery.data;
  return (
    <div className="flex-1 overflow-hidden relative">
      {tabs.map((tab) => {
        return <TabsContentItem key={tab.id} id={tab.id} />;
      })}
    </div>
  );
};
