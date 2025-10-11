import { useLiveQuery } from '@tanstack/react-db';

import { TabAddButton } from '@colanode/ui/components/layouts/tabs/tab-add-button';
import { TabsHeaderItem } from '@colanode/ui/components/layouts/tabs/tabs-header-item';
import { database } from '@colanode/ui/data';

interface TabsHeaderProps {
  activeTabId?: string;
}

export const TabsHeader = ({ activeTabId }: TabsHeaderProps) => {
  const tabsQuery = useLiveQuery((q) =>
    q
      .from({ tabs: database.tabs })
      .orderBy(({ tabs }) => tabs.index, `asc`)
      .select(({ tabs }) => {
        return {
          id: tabs.id,
          index: tabs.index,
        };
      })
  );

  const tabs = tabsQuery.data;
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
          />
        );
      })}

      <TabAddButton />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-background/5 to-border/10" />
    </div>
  );
};
