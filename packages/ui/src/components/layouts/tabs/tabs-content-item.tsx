import { RouterProvider } from '@tanstack/react-router';
import { useRef } from 'react';

import { useTabManager } from '@colanode/ui/contexts/tab-manager';
import { useAppMetadata } from '@colanode/ui/hooks/use-app-metadata';
import { cn } from '@colanode/ui/lib/utils';

interface TabsContentItemProps {
  id: string;
}

export const TabsContentItem = ({ id }: TabsContentItemProps) => {
  const tabManager = useTabManager();
  const activeTabId = useAppMetadata('tab');
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
