import { useLiveQuery } from '@tanstack/react-db';

import { collections } from '@colanode/ui/collections';
import { TabAddButton } from '@colanode/ui/components/layouts/tabs/tab-add-button';
import { TabsHeaderItem } from '@colanode/ui/components/layouts/tabs/tabs-header-item';

export const TabsHeader = () => {
  const tabsQuery = useLiveQuery((q) =>
    q
      .from({ tabs: collections.tabs })
      .orderBy(({ tabs }) => tabs.index, `asc`)
      .select(({ tabs }) => {
        return {
          id: tabs.id,
          index: tabs.index,
          lastActiveAt: tabs.lastActiveAt,
        };
      })
  );

  const tabs = tabsQuery.data;
  const activeTabId = tabs
    ? tabs.toSorted((a, b) => b.lastActiveAt.localeCompare(a.lastActiveAt))[0]
        ?.id
    : null;

  return (
    <div className="relative flex bg-sidebar border-b border-border h-10 overflow-hidden">
      {tabs.map((tab, index) => {
        const isLast = index === tabs.length - 1;
        const isActive = activeTabId ? tab.id === activeTabId : index === 0;

        return (
          <TabsHeaderItem
            key={tab.id}
            id={tab.id}
            index={index}
            isLast={isLast}
            isActive={isActive}
            canDelete={tabs.length > 1}
          />
        );
      })}

      <TabAddButton />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-background/5 to-border/10" />
    </div>
  );
};
