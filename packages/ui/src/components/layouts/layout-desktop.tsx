import { createMemoryHistory, createRouter } from '@tanstack/react-router';
import { useCallback, useRef } from 'react';

import { Tab } from '@colanode/client/types';
import {
  compareString,
  generateFractionalIndex,
  generateId,
  IdType,
} from '@colanode/core';
import { collections } from '@colanode/ui/collections';
import { buildMetadataKey } from '@colanode/ui/collections/metadata';
import { TabsContent } from '@colanode/ui/components/layouts/tabs/tabs-content';
import { TabsHeader } from '@colanode/ui/components/layouts/tabs/tabs-header';
import { TabManagerContext } from '@colanode/ui/contexts/tab-manager';
import { useMetadata } from '@colanode/ui/hooks/use-metadata';
import { router, routeTree } from '@colanode/ui/routes';

export const LayoutDesktop = () => {
  const routersRef = useRef<Map<string, typeof router>>(new Map());
  const [activeTabId, setActiveTabId] = useMetadata('app', 'tab');

  const handleTabAdd = useCallback((location: string) => {
    const tabs = collections.tabs.map((tab) => tab);
    const orderedTabs = tabs.toSorted((a, b) =>
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

    collections.tabs.insert(tab);
  }, []);

  const handleTabDelete = useCallback((id: string) => {
    const tabs = collections.tabs.map((tab) => tab);
    const tabMetadataKey = buildMetadataKey('app', 'tab');
    const tabMetadata = collections.metadata.get(tabMetadataKey);

    if (tabs.length === 1) {
      return;
    }

    if (tabMetadata?.value === id) {
      const nextTab = tabs
        .filter((tab) => tab.id !== id)
        .toSorted((a, b) => {
          const aDate = new Date(a.updatedAt ?? a.createdAt);
          const bDate = new Date(b.updatedAt ?? b.createdAt);
          return aDate.getTime() - bDate.getTime();
        })[0]?.id;

      if (!nextTab) {
        return;
      }

      const tabMetadata = collections.metadata.get('tab');
      if (tabMetadata) {
        collections.metadata.update('tab', (tab) => {
          tab.value = nextTab;
          tab.updatedAt = new Date().toISOString();
        });
      } else {
        collections.metadata.insert({
          namespace: 'app',
          key: 'tab',
          value: nextTab,
          createdAt: new Date().toISOString(),
          updatedAt: null,
        });
      }
    }

    collections.tabs.delete(id);
  }, []);

  const handleTabSwitch = useCallback(
    (id: string) => {
      setActiveTabId(id);
    },
    [setActiveTabId]
  );

  const handleTabGetRouter = useCallback((id: string) => {
    if (routersRef.current.has(id)) {
      return routersRef.current.get(id)!;
    }

    const tab = collections.tabs.get(id);
    if (!tab) {
      throw new Error(`Tab ${id} not found`);
    }

    const router = createRouter({
      routeTree,
      context: {},
      history: createMemoryHistory({
        initialEntries: [tab.location ?? '/'],
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
        <TabsHeader activeTabId={activeTabId} />
        <TabsContent activeTabId={activeTabId} />
      </div>
    </TabManagerContext.Provider>
  );
};
