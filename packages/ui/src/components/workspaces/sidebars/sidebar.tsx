import { useState } from 'react';

import { SidebarMenuType } from '@colanode/client/types';
import { SidebarChats } from '@colanode/ui/components/workspaces/sidebars/sidebar-chats';
import { SidebarMenu } from '@colanode/ui/components/workspaces/sidebars/sidebar-menu';
import { SidebarSettings } from '@colanode/ui/components/workspaces/sidebars/sidebar-settings';
import { SidebarSpaces } from '@colanode/ui/components/workspaces/sidebars/sidebar-spaces';
import { useApp } from '@colanode/ui/contexts/app';
import { cn } from '@colanode/ui/lib/utils';

export const Sidebar = () => {
  const app = useApp();
  const [menu, setMenu] = useState<SidebarMenuType>('spaces');

  return (
    <div
      className={cn(
        'flex h-full min-h-full max-h-full w-full min-w-full flex-row',
        app.type === 'mobile' ? 'bg-background' : 'bg-sidebar'
      )}
    >
      <SidebarMenu value={menu} onChange={setMenu} />
      <div className="min-h-0 flex-grow overflow-auto border-l border-sidebar-border">
        {menu === 'spaces' && <SidebarSpaces />}
        {menu === 'chats' && <SidebarChats />}
        {menu === 'settings' && <SidebarSettings />}
      </div>
    </div>
  );
};
