import { Outlet } from '@tanstack/react-router';
import { Resizable } from 're-resizable';
import { useCallback, useState } from 'react';

import { SidebarMenuType, SidebarMetadata } from '@colanode/client/types';
import { Sidebar } from '@colanode/ui/components/layouts/sidebars/sidebar';
import { useWorkspace } from '@colanode/ui/contexts/workspace';

export const WorkspaceLayout = () => {
  const workspace = useWorkspace();
  const [sidebarMetadata, setSidebarMetadata] = useState<SidebarMetadata>(
    workspace.getMetadata('sidebar')?.value ?? {
      menu: 'spaces',
      width: 300,
    }
  );

  const handleSidebarResize = useCallback(
    (width: number) => {
      setSidebarMetadata({
        ...sidebarMetadata,
        width,
      });

      workspace.setMetadata('sidebar', {
        ...sidebarMetadata,
        width,
      });
    },
    [workspace, sidebarMetadata]
  );

  const handleMenuChange = useCallback(
    (menu: SidebarMenuType) => {
      setSidebarMetadata({
        ...sidebarMetadata,
        menu,
      });

      workspace.setMetadata('sidebar', {
        ...sidebarMetadata,
        menu,
      });
    },
    [workspace, sidebarMetadata]
  );

  return (
    <div className="w-screen min-w-screen h-screen min-h-screen flex flex-row bg-background">
      <Resizable
        as="aside"
        size={{ width: sidebarMetadata.width, height: '100vh' }}
        className="border-r border-sidebar-border"
        minWidth={200}
        maxWidth={500}
        enable={{
          bottom: false,
          bottomLeft: false,
          bottomRight: false,
          left: false,
          right: true,
          top: false,
          topLeft: false,
          topRight: false,
        }}
        handleClasses={{
          right: 'opacity-0 hover:opacity-100 bg-blue-300 z-30',
        }}
        handleStyles={{
          right: {
            width: '3px',
            right: '-3px',
          },
        }}
        onResize={(_, __, ref) => {
          handleSidebarResize(ref.offsetWidth);
        }}
      >
        <Sidebar menu={sidebarMetadata.menu} onMenuChange={handleMenuChange} />
      </Resizable>

      <div className="h-full max-h-screen w-full flex-grow overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
};
