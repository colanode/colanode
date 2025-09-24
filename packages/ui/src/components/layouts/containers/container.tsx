import { Outlet } from '@tanstack/react-router';
import { useState } from 'react';

import { SidebarMobile } from '@colanode/ui/components/layouts/sidebars/sidebar-mobile';
import { useApp } from '@colanode/ui/contexts/app';
import { ContainerContext } from '@colanode/ui/contexts/container';
import { useIsMobile } from '@colanode/ui/hooks/use-is-mobile';
import { cn } from '@colanode/ui/lib/utils';

export const Container = () => {
  const app = useApp();
  const isMobile = useIsMobile();
  const [settings, setSettings] = useState<React.ReactNode>(null);
  const [breadcrumb, setBreadcrumb] = useState<React.ReactNode>(null);

  return (
    <ContainerContext.Provider
      value={{
        setSettings,
        setBreadcrumb,
        resetSettings: () => setSettings(null),
        resetBreadcrumb: () => setBreadcrumb(null),
      }}
    >
      <div className="flex flex-col w-full h-full min-w-full min-h-full">
        <div
          className={cn(
            'flex flex-row w-full items-center gap-2 p-3',
            app.type === 'mobile' && 'p-0 pr-2'
          )}
        >
          {isMobile && <SidebarMobile />}
          {breadcrumb && <div className="flex-1">{breadcrumb}</div>}
          {settings}
        </div>
        <div className="lg:px-10 px-4 lg:py-4 py-2 flex-grow max-h-full h-full overflow-hidden">
          <Outlet />
        </div>
      </div>
    </ContainerContext.Provider>
  );
};
