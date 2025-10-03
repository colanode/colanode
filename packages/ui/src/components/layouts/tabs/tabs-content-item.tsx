import { RouterProvider } from '@tanstack/react-router';
import { useRef } from 'react';
import { useShallow } from 'zustand/shallow';

import { useTabManager } from '@colanode/ui/contexts/tab-manager';
import { cn } from '@colanode/ui/lib/utils';
import { useAppStore } from '@colanode/ui/stores/app';

interface TabsContentItemProps {
  id: string;
}

export const TabsContentItem = ({ id }: TabsContentItemProps) => {
  const tabManager = useTabManager();
  const activeTabId = useAppStore(useShallow((state) => state.metadata.tab));
  const isActive = id === activeTabId;

  const routerRef = useRef(tabManager.getRouter(id));

  return (
    <div
      className={cn(
        'absolute inset-0 transition-opacity duration-200',
        isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'
      )}
      style={{
        pointerEvents: isActive ? 'auto' : 'none',
      }}
    >
      <RouterProvider router={routerRef.current} />
    </div>
  );
};
