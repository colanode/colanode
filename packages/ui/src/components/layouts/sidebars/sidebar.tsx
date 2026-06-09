import { useState } from 'react';

import { SidebarMenuType } from '@colanode/client/types';
import { SidebarChats } from '@colanode/ui/components/layouts/sidebars/sidebar-chats';
import { SidebarMenu } from '@colanode/ui/components/layouts/sidebars/sidebar-menu';
import { SidebarSettings } from '@colanode/ui/components/layouts/sidebars/sidebar-settings';
import { SidebarSpaces } from '@colanode/ui/components/layouts/sidebars/sidebar-spaces';
import { useApp } from '@colanode/ui/contexts/app';
import { cn } from '@colanode/ui/lib/utils';

interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar = ({ collapsed = false, onToggleCollapse }: SidebarProps) => {
  const app = useApp();
  const [menu, setMenu] = useState<SidebarMenuType>('spaces');

  const handleMenuChange = (next: SidebarMenuType) => {
    if (collapsed) {
      onToggleCollapse?.();
      setMenu(next);
      return;
    }
    if (next === menu) {
      onToggleCollapse?.();
      return;
    }
    setMenu(next);
  };

  return (
    <div
      className={cn(
        'flex h-full min-h-full max-h-full w-full min-w-full flex-row',
        app.type === 'mobile' ? 'bg-background' : 'bg-sidebar'
      )}
    >
      <SidebarMenu value={menu} onChange={handleMenuChange} />
      {!collapsed && (
        <div className="min-h-0 grow overflow-auto border-l border-sidebar-border">
          {menu === 'spaces' && <SidebarSpaces />}
          {menu === 'chats' && <SidebarChats />}
          {menu === 'settings' && <SidebarSettings />}
        </div>
      )}
    </div>
  );
};
