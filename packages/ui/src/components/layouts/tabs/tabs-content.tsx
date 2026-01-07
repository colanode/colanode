import { useLiveQuery } from '@tanstack/react-db';

import { collections } from '@colanode/ui/collections';
import { TabsContentItem } from '@colanode/ui/components/layouts/tabs/tabs-content-item';

export const TabsContent = () => {
  const tabsQuery = useLiveQuery(
    (q) =>
      q
        .from({ tabs: collections.tabs })
        .orderBy(({ tabs }) => tabs.index, `asc`)
        .select(({ tabs }) => ({
          id: tabs.id,
          lastActiveAt: tabs.lastActiveAt,
        })),
    []
  );

  const tabs = tabsQuery.data;
  const activeTabId = tabs
    ? tabs.toSorted((a, b) => b.lastActiveAt.localeCompare(a.lastActiveAt))[0]
        ?.id
    : null;

  return (
    <div className="flex-1 overflow-hidden relative">
      {tabs.map((tab, index) => {
        const isActive = activeTabId ? tab.id === activeTabId : index === 0;
        return <TabsContentItem key={tab.id} id={tab.id} isActive={isActive} />;
      })}
    </div>
  );
};
