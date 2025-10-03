import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { useCallback, useRef } from 'react';

import { Tab } from '@colanode/client/types';
import {
  compareString,
  generateFractionalIndex,
  generateId,
  IdType,
} from '@colanode/core';
import { LayoutAddTabButton } from '@colanode/ui/components/layouts/layout-add-tab-button';
import { LayoutTabBar } from '@colanode/ui/components/layouts/layout-tab-bar';
import { cn } from '@colanode/ui/lib/utils';
import { router, routeTree } from '@colanode/ui/router';
import { useAppStore } from '@colanode/ui/stores/app';

export const LayoutTabs = () => {
  const allTabs = useAppStore((state) => state.tabs);
  const activeTabId = useAppStore((state) => state.metadata.tab);
  const tabs = Object.values(allTabs).sort((a, b) =>
    compareString(a.index, b.index)
  );
  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? tabs[0]!;
  const routers = useRef<Record<string, typeof router>>(
    tabs.reduce(
      (acc, tab) => {
        const router = createRouter({
          routeTree,
          context: {},
          history: createMemoryHistory({ initialEntries: [tab.location] }),
          defaultPreload: 'intent',
          scrollRestoration: true,
          defaultStructuralSharing: false,
          defaultPreloadStaleTime: 0,
        });

        router.subscribe('onRendered', (event) => {
          if (!event.hrefChanged) {
            return;
          }

          const location = event.toLocation.href;
          useAppStore.getState().upsertTab({
            ...tab,
            location,
          });

          window.colanode.executeMutation({
            type: 'tab.update',
            id: tab.id,
            location,
          });
        });

        acc[tab.id] = router;
        return acc;
      },
      {} as Record<string, typeof router>
    )
  );

  const deleteTab = useCallback((tabId: string) => {
    const currentTabs = useAppStore.getState().tabs;
    if (!currentTabs[tabId]) {
      return;
    }

    if (Object.keys(currentTabs).length === 1) {
      return;
    }

    useAppStore.getState().deleteTab(tabId);

    window.colanode.executeMutation({
      type: 'tab.delete',
      id: tabId,
    });
  }, []);

  const switchTab = useCallback((tabId: string) => {
    const currentTabs = useAppStore.getState().tabs;
    if (!currentTabs[tabId]) {
      return;
    }

    useAppStore.getState().updateAppMetadata({
      key: 'tab',
      value: tabId,
    });

    window.colanode.executeMutation({
      type: 'app.metadata.update',
      key: 'tab',
      value: tabId,
    });
  }, []);

  const addTab = useCallback(() => {
    const lastIndex = tabs[tabs.length - 1]?.index;
    const tab: Tab = {
      id: generateId(IdType.Tab),
      location: '/',
      index: generateFractionalIndex(lastIndex, null),
      createdAt: new Date().toISOString(),
      updatedAt: null,
    };

    useAppStore.getState().upsertTab(tab);

    window.colanode.executeMutation({
      type: 'tab.create',
      id: tab.id,
      location: tab.location,
      index: tab.index,
    });
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="relative flex bg-sidebar border-b border-border h-10 overflow-hidden">
        {tabs.map((tab, index) => {
          const isActive = tab.id === activeTab.id;
          const isLast =
            index === tabs.length - 1 || tabs[index + 1]?.id === activeTab.id;

          const router = routers.current[tab.id];
          if (!router) {
            return null;
          }

          return (
            <LayoutTabBar
              key={tab.id}
              tab={tab}
              router={router}
              index={index}
              isActive={isActive}
              isLast={isLast}
              onClick={() => switchTab(tab.id)}
              onDelete={() => deleteTab(tab.id)}
            />
          );
        })}

        <LayoutAddTabButton onAddTab={addTab} />
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-background/5 to-border/10" />
      </div>

      <div className="flex-1 overflow-hidden relative">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab.id;

          const router = routers.current[tab.id];
          if (!router) {
            return null;
          }

          return (
            <div
              key={tab.id}
              className={cn(
                'absolute inset-0 transition-opacity duration-200',
                isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'
              )}
              style={{
                pointerEvents: isActive ? 'auto' : 'none',
              }}
            >
              <RouterProvider router={router} />
            </div>
          );
        })}
      </div>
    </div>
  );
};
