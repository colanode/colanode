import { Resizable } from 're-resizable';
import { useCallback, useState } from 'react';

import { SidebarMenuType, SidebarMetadata } from '@colanode/client/types';
import { WorkspaceSidebarChats } from '@colanode/ui/components/workspaces/sidebars/workspace-sidebar-chats';
import { WorkspaceSidebarMenu } from '@colanode/ui/components/workspaces/sidebars/workspace-sidebar-menu';
import { WorkspaceSidebarSettings } from '@colanode/ui/components/workspaces/sidebars/workspace-sidebar-settings';
import { WorkspaceSidebarSpaces } from '@colanode/ui/components/workspaces/sidebars/workspace-sidebar-spaces';
import { useWorkspaceMetadata } from '@colanode/ui/contexts/workspace-metadata';

export const WorkspaceSidebar = () => {
  const workspaceMetadata = useWorkspaceMetadata();
  const [sidebarMetadata, setSidebarMetadata] = useState<SidebarMetadata>(
    workspaceMetadata.get('sidebar')?.value ?? {
      menu: 'spaces',
      width: 300,
    }
  );

  const menu = sidebarMetadata.menu;
  const width = sidebarMetadata.width;

  const handleSidebarResize = useCallback(
    (width: number) => {
      setSidebarMetadata({
        ...sidebarMetadata,
        width,
      });

      workspaceMetadata.set('sidebar', {
        ...sidebarMetadata,
        width,
      });
    },
    [workspaceMetadata, sidebarMetadata]
  );

  const handleMenuChange = useCallback(
    (menu: SidebarMenuType) => {
      setSidebarMetadata({
        ...sidebarMetadata,
        menu,
      });

      workspaceMetadata.set('sidebar', {
        ...sidebarMetadata,
        menu,
      });
    },
    [workspaceMetadata, sidebarMetadata]
  );

  return (
    <Resizable
      as="aside"
      size={{ width, height: '100vh' }}
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
      <div className="flex h-screen min-h-screen max-h-screen w-full min-w-full flex-row bg-sidebar">
        <WorkspaceSidebarMenu value={menu} onChange={handleMenuChange} />
        <div className="min-h-0 flex-grow overflow-auto border-l border-sidebar-border">
          {menu === 'spaces' && <WorkspaceSidebarSpaces />}
          {menu === 'chats' && <WorkspaceSidebarChats />}
          {menu === 'settings' && <WorkspaceSidebarSettings />}
        </div>
      </div>
    </Resizable>
  );
};
