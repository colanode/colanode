import { createMemoryHistory, createRouter } from '@tanstack/react-router';
import { useCallback, useRef } from 'react';

import { Tab } from '@colanode/client/types';
import {
  compareString,
  generateFractionalIndex,
  generateId,
  IdType,
} from '@colanode/core';
import { TabsContent } from '@colanode/ui/components/layouts/tabs/tabs-content';
import { TabsHeader } from '@colanode/ui/components/layouts/tabs/tabs-header';
import { TabManagerContext } from '@colanode/ui/contexts/tab-manager';
import { router, routeTree } from '@colanode/ui/routes';
import { useAppStore } from '@colanode/ui/stores/app';

export const LayoutDesktop = () => {
  const routersRef = useRef<Map<string, typeof router>>(new Map());

  const handleTabAdd = useCallback((location: string) => {
    const store = useAppStore.getState();
    const orderedTabs = store.tabs.toSorted((a, b) =>
      compareString(a.index, b.index)
    );

    const lastIndex = orderedTabs[orderedTabs.length - 1]?.index;
    const tab: Tab = {
      id: generateId(IdType.Tab),
      location,
      index: generateFractionalIndex(lastIndex, null),
      createdAt: new Date().toISOString(),
      updatedAt: null,
    };

    store.upsertTab(tab);

    window.colanode.executeMutation?.({
      type: 'tab.create',
      id: tab.id,
      location: tab.location,
      index: tab.index,
    });
  }, []);

  const handleTabDelete = useCallback((id: string) => {
    const store = useAppStore.getState();

    if (store.tabs.length === 1) {
      return;
    }

    if (store.metadata.tab === id) {
      const nextTab = store.tabs
        .filter((tab) => tab.id !== id)
        .toSorted((a, b) => {
          const aDate = new Date(a.updatedAt ?? a.createdAt);
          const bDate = new Date(b.updatedAt ?? b.createdAt);
          return aDate.getTime() - bDate.getTime();
        })[0]?.id;

      if (!nextTab) {
        return;
      }

      store.updateAppMetadata({
        key: 'tab',
        value: nextTab,
      });

      window.colanode.executeMutation?.({
        type: 'app.metadata.update',
        key: 'tab',
        value: nextTab,
      });
    }

    store.deleteTab(id);
    window.colanode.executeMutation?.({
      type: 'tab.delete',
      id,
    });
  }, []);

  const handleTabSwitch = useCallback((id: string) => {
    const store = useAppStore.getState();
    store.updateAppMetadata({
      key: 'tab',
      value: id,
    });
  }, []);

  const handleTabGetRouter = useCallback((id: string) => {
    if (routersRef.current.has(id)) {
      return routersRef.current.get(id)!;
    }

    const store = useAppStore.getState();
    const tab = store.tabs.find((tab) => tab.id === id);
    if (!tab) {
      throw new Error(`Tab ${id} not found`);
    }

    const router = createRouter({
      routeTree,
      context: {},
      history: createMemoryHistory({
        initialEntries: [tab.location],
      }),
      defaultPreload: 'intent',
      scrollRestoration: true,
      defaultPreloadStaleTime: 0,
    });

    router.subscribe('onRendered', (event) => {
      if (!event.hrefChanged) {
        return;
      }

      const location = event.toLocation.href;
      console.log('onRendered', id, location);
      window.colanode.executeMutation({
        type: 'tab.update',
        id,
        location,
      });
    });

    routersRef.current.set(id, router);
    return router;
  }, []);

  return (
    <TabManagerContext.Provider
      value={{
        addTab: handleTabAdd,
        deleteTab: handleTabDelete,
        switchTab: handleTabSwitch,
        getRouter: handleTabGetRouter,
      }}
    >
      <div className="flex flex-col h-full">
        <TabsHeader />
        <TabsContent />
      </div>
    </TabManagerContext.Provider>
  );
};
