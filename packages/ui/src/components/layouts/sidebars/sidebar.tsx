import { SidebarMenuType } from '@colanode/client/types';
import { SidebarChats } from '@colanode/ui/components/layouts/sidebars/sidebar-chats';
import { SidebarMenu } from '@colanode/ui/components/layouts/sidebars/sidebar-menu';
import { SidebarSpaces } from '@colanode/ui/components/layouts/sidebars/sidebar-spaces';

interface SidebarProps {
  menu: SidebarMenuType;
  onMenuChange: (menu: SidebarMenuType) => void;
}

export const Sidebar = ({ menu, onMenuChange }: SidebarProps) => {
  return (
    <div className="flex h-screen min-h-screen max-h-screen w-full min-w-full flex-row bg-slate-50">
      <SidebarMenu value={menu} onChange={onMenuChange} />
      <div className="min-h-0 flex-grow overflow-auto">
        {menu === 'spaces' && <SidebarSpaces />}
        {menu === 'chats' && <SidebarChats />}
      </div>
    </div>
  );
};
