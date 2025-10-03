import { useMemo } from 'react';

import { compareString } from '@colanode/core';
import { TabsContentItem } from '@colanode/ui/components/layouts/tabs/tabs-content-item';
import { useAppStore } from '@colanode/ui/stores/app';

export const TabsContent = () => {
  const tabs = useAppStore((state) => state.tabs);
  const sortedTabs = useMemo(() => {
    return tabs.toSorted((a, b) => compareString(a.index, b.index));
  }, [tabs]);

  return (
    <div className="flex-1 overflow-hidden relative">
      {sortedTabs.map((tab) => {
        return <TabsContentItem key={tab.id} id={tab.id} />;
      })}
    </div>
  );
};
