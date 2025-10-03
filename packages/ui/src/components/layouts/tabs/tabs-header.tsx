import { useMemo } from 'react';

import { compareString } from '@colanode/core';
import { TabAddButton } from '@colanode/ui/components/layouts/tabs/tab-add-button';
import { TabsHeaderItem } from '@colanode/ui/components/layouts/tabs/tabs-header-item';
import { useAppStore } from '@colanode/ui/stores/app';

export const TabsHeader = () => {
  const tabs = useAppStore((state) => state.tabs);

  const sortedTabs = useMemo(() => {
    return tabs.toSorted((a, b) => compareString(a.index, b.index));
  }, [tabs]);

  return (
    <div className="relative flex bg-sidebar border-b border-border h-10 overflow-hidden">
      {sortedTabs.map((tab, index) => {
        const isLast = index === tabs.length - 1;

        return (
          <TabsHeaderItem
            key={tab.id}
            id={tab.id}
            index={index}
            isLast={isLast}
          />
        );
      })}

      <TabAddButton />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-background/5 to-border/10" />
    </div>
  );
};
