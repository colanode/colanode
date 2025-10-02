import { Plus, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { AppTab } from '@colanode/client/types';
import { generateId, IdType } from '@colanode/core';
import { LayoutTabContent } from '@colanode/ui/components/layouts/layout-tab-content';
import { cn } from '@colanode/ui/lib/utils';
import { useAppStore } from '@colanode/ui/stores/app';

export const LayoutTabs = () => {
  const tabs = useAppStore((state) => state.metadata.tabs);
  const activeTab = tabs.find((tab) => tab.active);
  const [draggedTab, setDraggedTab] = useState<string | null>(null);
  const [dragOverTab, setDragOverTab] = useState<string | null>(null);

  useEffect(() => {
    const currentTabs = useAppStore.getState().metadata.tabs;
    if (currentTabs.length === 0) {
      const newTab: AppTab = {
        id: generateId(IdType.Tab),
        location: '/',
        active: true,
      };

      useAppStore.getState().updateAppMetadata({
        key: 'tabs',
        value: [newTab],
      });
    }
  }, []);

  const deleteTab = useCallback((tabId: string) => {
    const currentTabs = useAppStore.getState().metadata.tabs;
    const tabToDelete = currentTabs.find((tab) => tab.id === tabId);
    const newTabs = currentTabs.filter((tab) => tab.id !== tabId);

    if (newTabs.length === 0) {
      return;
    }

    // If the deleted tab was active, activate another tab
    if (tabToDelete?.active) {
      const deletedTabIndex = currentTabs.findIndex((tab) => tab.id === tabId);
      let tabToActivate: AppTab;

      // Try to activate the next tab, or the previous one if it was the last tab
      if (deletedTabIndex < newTabs.length) {
        // Activate the tab that will be at the same index after deletion
        tabToActivate = newTabs[deletedTabIndex]!;
      } else {
        // Activate the last tab if we deleted the last tab
        tabToActivate = newTabs[newTabs.length - 1]!;
      }

      // Update the tabs with the new active tab
      const updatedTabs = newTabs.map((tab) => ({
        ...tab,
        active: tab.id === tabToActivate.id,
      }));

      useAppStore.getState().updateAppMetadata({
        key: 'tabs',
        value: updatedTabs,
      });
    } else {
      // If the deleted tab wasn't active, just remove it
      useAppStore.getState().updateAppMetadata({
        key: 'tabs',
        value: newTabs,
      });
    }
  }, []);

  const switchTab = useCallback((tabId: string) => {
    const currentTabs = useAppStore.getState().metadata.tabs;
    const updatedTabs = currentTabs.map((tab) => ({
      ...tab,
      active: tab.id === tabId,
    }));

    useAppStore.getState().updateAppMetadata({
      key: 'tabs',
      value: updatedTabs,
    });
  }, []);

  const updateTabLocation = useCallback((location: string) => {
    const currentTabs = useAppStore.getState().metadata.tabs;
    const updatedTabs = currentTabs.map((tab) =>
      tab.active ? { ...tab, location } : tab
    );

    useAppStore.getState().updateAppMetadata({
      key: 'tabs',
      value: updatedTabs,
    });
  }, []);

  const addTab = useCallback(() => {
    const currentTabs = useAppStore.getState().metadata.tabs;
    const newTab: AppTab = {
      id: generateId(IdType.Tab),
      location: '/',
      active: true,
    };

    // Set all existing tabs to inactive
    const updatedTabs = currentTabs.map((tab) => ({ ...tab, active: false }));

    useAppStore.getState().updateAppMetadata({
      key: 'tabs',
      value: [...updatedTabs, newTab],
    });
  }, []);

  const reorderTabs = useCallback((draggedId: string, targetId: string) => {
    const currentTabs = useAppStore.getState().metadata.tabs;
    const draggedIndex = currentTabs.findIndex((tab) => tab.id === draggedId);
    const targetIndex = currentTabs.findIndex((tab) => tab.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newTabs = [...currentTabs];
    const [draggedTab] = newTabs.splice(draggedIndex, 1);
    if (draggedTab) {
      newTabs.splice(targetIndex, 0, draggedTab);
    }

    useAppStore.getState().updateAppMetadata({
      key: 'tabs',
      value: newTabs,
    });
  }, []);

  const handleDragStart = useCallback((e: React.DragEvent, tabId: string) => {
    setDraggedTab(tabId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', tabId);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, tabId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverTab(tabId);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverTab(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetTabId: string) => {
      e.preventDefault();
      const draggedTabId = e.dataTransfer.getData('text/plain');

      if (draggedTabId && draggedTabId !== targetTabId) {
        reorderTabs(draggedTabId, targetTabId);
      }

      setDraggedTab(null);
      setDragOverTab(null);
    },
    [reorderTabs]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedTab(null);
    setDragOverTab(null);
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar with browser-like styling */}
      <div className="relative flex bg-sidebar border-b border-border h-10 overflow-hidden">
        {tabs.map((tab, index) => (
          <div
            key={tab.id}
            draggable
            className={cn(
              'relative group/tab app-no-drag-region flex items-center gap-2 px-4 py-2 cursor-pointer transition-all duration-200 min-w-[120px] max-w-[240px] flex-1',
              // Active tab styling with proper z-index for overlapping
              tab.active
                ? 'bg-background text-foreground z-20 shadow-[0_-2px_8px_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.05)] border-t border-l border-r border-border'
                : 'bg-sidebar-accent/60 text-muted-foreground hover:bg-sidebar-accent hover:text-foreground z-10 hover:z-15 shadow-[0_1px_3px_rgba(0,0,0,0.1)]',
              // Add overlap effect - each tab overlaps the previous one
              index > 0 && '-ml-3',
              // Drag states
              draggedTab === tab.id && 'opacity-50 scale-95',
              dragOverTab === tab.id && 'bg-primary/20',
              // Ensure proper stacking order
              `relative`
            )}
            style={{
              clipPath: tab.active
                ? 'polygon(12px 0%, calc(100% - 12px) 0%, 100% 100%, 0% 100%)'
                : 'polygon(12px 0%, calc(100% - 12px) 0%, calc(100% - 6px) 100%, 6px 100%)',
            }}
            onClick={() => switchTab(tab.id)}
            onDragStart={(e) => handleDragStart(e, tab.id)}
            onDragOver={(e) => handleDragOver(e, tab.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, tab.id)}
            onDragEnd={handleDragEnd}
          >
            {/* Tab content */}
            <div className="flex items-center gap-2 flex-1 min-w-0 z-10">
              <div className="truncate text-sm font-medium">
                Tab {index + 1}
              </div>
              <button
                className={cn(
                  'opacity-0 group-hover/tab:opacity-100 transition-all duration-200 flex-shrink-0 rounded-full p-1 hover:bg-destructive/20 hover:text-destructive',
                  tab.active && 'opacity-70 hover:opacity-100',
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
            {!tab.active &&
              index < tabs.length - 1 &&
              !tabs[index + 1]?.active && (
                <div className="absolute right-0 top-2 bottom-2 w-px bg-border/50" />
              )}
          </div>
        ))}

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

      <div className="flex-1 overflow-hidden">
        {activeTab && (
          <LayoutTabContent
            key={activeTab.id}
            location={activeTab.location}
            onChange={updateTabLocation}
          />
        )}
      </div>
    </div>
  );
};
