import { Outlet } from '@tanstack/react-router';
import { useRef, useState } from 'react';

import {
  ScrollArea,
  ScrollBar,
  ScrollViewport,
} from '@colanode/ui/components/ui/scroll-area';
import { SidebarMobile } from '@colanode/ui/components/workspaces/sidebars/sidebar-mobile';
import { useApp } from '@colanode/ui/contexts/app';
import { ContainerContext } from '@colanode/ui/contexts/container';
import { useIsMobile } from '@colanode/ui/hooks/use-is-mobile';
import { cn } from '@colanode/ui/lib/utils';

export const Container = () => {
  const app = useApp();
  const isMobile = useIsMobile();
  const [settings, setSettings] = useState<React.ReactNode>(null);
  const [breadcrumb, setBreadcrumb] = useState<React.ReactNode>(null);

  const scrollAreaRef = useRef<HTMLDivElement>(null!);
  const scrollViewportRef = useRef<HTMLDivElement>(null!);

  return (
    <ContainerContext.Provider
      value={{
        setSettings,
        setBreadcrumb,
        resetSettings: () => setSettings(null),
        resetBreadcrumb: () => setBreadcrumb(null),
        scrollAreaRef,
        scrollViewportRef,
      }}
    >
      <div className="flex h-full flex-col">
        <div
          className={cn(
            'sticky top-0 z-20 flex flex-row w-full items-center gap-2 p-3 h-10 mb-2 shrink-0 bg-background/80 backdrop-blur',
            app.type === 'mobile' && 'p-0 pr-2'
          )}
        >
          {isMobile && <SidebarMobile />}
          {breadcrumb && <div className="flex-1">{breadcrumb}</div>}
          {settings}
        </div>
        <ScrollArea ref={scrollAreaRef} className="overflow-hidden h-full">
          <ScrollViewport ref={scrollViewportRef} className="h-full">
            <div className="lg:px-10 px-4 min-h-0 flex-1 h-full">
              <Outlet />
            </div>
          </ScrollViewport>
          <ScrollBar orientation="horizontal" />
          <ScrollBar orientation="vertical" />
        </ScrollArea>
      </div>
    </ContainerContext.Provider>
  );
};
