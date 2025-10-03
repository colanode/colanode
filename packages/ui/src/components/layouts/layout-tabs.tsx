import { Plus, X } from 'lucide-react';
import { useCallback } from 'react';

import { Tab } from '@colanode/client/types';
import {
  compareString,
  generateFractionalIndex,
  generateId,
  IdType,
} from '@colanode/core';
import { LayoutTabContent } from '@colanode/ui/components/layouts/layout-tab-content';
import { cn } from '@colanode/ui/lib/utils';
import { useAppStore } from '@colanode/ui/stores/app';

export const LayoutTabs = () => {
  const allTabs = useAppStore((state) => state.tabs);
  const activeTabId = useAppStore((state) => state.metadata.tab);

  const tabs = Object.values(allTabs).sort((a, b) =>
    compareString(a.index, b.index)
  );
  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? tabs[0]!;

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

  const updateTabLocation = useCallback((tabId: string, location: string) => {
    const allTabs = useAppStore.getState().tabs;
    const tab = allTabs[tabId];
    if (!tab) {
      return;
    }

    useAppStore.getState().upsertTab({
      ...tab,
      location,
    });

    window.colanode.executeMutation({
      type: 'tab.update',
      id: tabId,
      location,
    });
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar with browser-like styling */}
      <div className="relative flex bg-sidebar border-b border-border h-10 overflow-hidden">
        {tabs.map((tab, index) => {
          const isActive = tab.id === activeTab.id;
          return (
            <div
              key={tab.id}
              className={cn(
                'relative group/tab app-no-drag-region flex items-center gap-2 px-4 py-2 cursor-pointer transition-all duration-200 min-w-[120px] max-w-[240px] flex-1',
                // Active tab styling with proper z-index for overlapping
                isActive
                  ? 'bg-background text-foreground z-20 shadow-[0_-2px_8px_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.05)] border-t border-l border-r border-border'
                  : 'bg-sidebar-accent/60 text-muted-foreground hover:bg-sidebar-accent hover:text-foreground z-10 hover:z-15 shadow-[0_1px_3px_rgba(0,0,0,0.1)]',
                // Add overlap effect - each tab overlaps the previous one
                index > 0 && '-ml-3',
                // Ensure proper stacking order
                `relative`
              )}
              style={{
                clipPath: isActive
                  ? 'polygon(12px 0%, calc(100% - 12px) 0%, 100% 100%, 0% 100%)'
                  : 'polygon(12px 0%, calc(100% - 12px) 0%, calc(100% - 6px) 100%, 6px 100%)',
              }}
              onClick={() => switchTab(tab.id)}
            >
              {/* Tab content */}
              <div className="flex items-center gap-2 flex-1 min-w-0 z-10">
                <div className="truncate text-sm font-medium">
                  Tab {index + 1}
                </div>
                <button
                  className={cn(
                    'opacity-0 group-hover/tab:opacity-100 transition-all duration-200 flex-shrink-0 rounded-full p-1 hover:bg-destructive/20 hover:text-destructive',
                    isActive && 'opacity-70 hover:opacity-100',
                    'ml-auto' // Push to the right edge
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteTab(tab.id);
                  }}
                  title="Close tab"
                >
                  <X className="size-3" />
                </button>
              </div>

              {/* Browser-like tab separator */}
              {!isActive &&
                index < tabs.length - 1 &&
                tabs[index + 1]?.id !== activeTab.id && (
                  <div className="absolute right-0 top-2 bottom-2 w-px bg-border/50" />
                )}
            </div>
          );
        })}

        {/* Add tab button */}
        <button
          onClick={addTab}
          className="flex items-center justify-center w-10 h-10 bg-sidebar hover:bg-sidebar-accent transition-all duration-200 app-no-drag-region flex-shrink-0 border-l border-border/30 hover:border-border/60 rounded-tl-md"
          title="Add new tab"
        >
          <Plus className="size-4 text-muted-foreground hover:text-foreground transition-colors" />
        </button>

        {/* Tab bar background with subtle gradient */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-background/5 to-border/10" />
      </div>

      <div className="flex-1 overflow-hidden relative">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab.id;
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
              <LayoutTabContent
                location={tab.location}
                onChange={(location) => updateTabLocation(tab.id, location)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
