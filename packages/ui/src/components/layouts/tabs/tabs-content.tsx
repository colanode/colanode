import { useLiveQuery } from '@tanstack/react-db';

import { collections } from '@colanode/ui/collections';
import { TabsContentItem } from '@colanode/ui/components/layouts/tabs/tabs-content-item';

interface TabsContentProps {
  activeTabId?: string;
}

export const TabsContent = ({ activeTabId }: TabsContentProps) => {
  const tabsQuery = useLiveQuery((q) =>
    q
      .from({ tabs: collections.tabs })
      .orderBy(({ tabs }) => tabs.index, `asc`)
      .select(({ tabs }) => ({
        id: tabs.id,
      }))
  );

  const tabs = tabsQuery.data;
  return (
    <div className="flex-1 overflow-hidden relative">
      {tabs.map((tab, index) => {
        const isActive = activeTabId ? tab.id === activeTabId : index === 0;
        return <TabsContentItem key={tab.id} id={tab.id} isActive={isActive} />;
      })}
    </div>
  );
};
