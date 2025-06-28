import { LayoutGrid, MessageCircle } from 'lucide-react';

import { SidebarMenuType } from '@colanode/client/types';
import { SidebarMenuFooter } from '@colanode/ui/components/layouts/sidebars/sidebar-menu-footer';
import { SidebarMenuHeader } from '@colanode/ui/components/layouts/sidebars/sidebar-menu-header';
import { SidebarMenuIcon } from '@colanode/ui/components/layouts/sidebars/sidebar-menu-icon';
import { useApp } from '@colanode/ui/contexts/app';
import { useRadar } from '@colanode/ui/contexts/radar';
import { useWorkspace } from '@colanode/ui/contexts/workspace';

interface SidebarMenuProps {
  value: SidebarMenuType;
  onChange: (value: SidebarMenuType) => void;
}

export const SidebarMenu = ({ value, onChange }: SidebarMenuProps) => {
  const app = useApp();
  const workspace = useWorkspace();
  const radar = useRadar();

  const platform = app.getMetadata('platform');
  const windowSize = app.getMetadata('window.size');
  const showMacOsPlaceholder = platform === 'darwin' && !windowSize?.fullscreen;

  const chatsState = radar.getChatsState(workspace.accountId, workspace.id);
  const channelsState = radar.getChannelsState(
    workspace.accountId,
    workspace.id
  );

  return (
    <div className="flex flex-col h-full w-[65px] min-w-[65px] items-center bg-slate-100">
      {showMacOsPlaceholder ? (
        <div className="w-full h-8 flex gap-[8px] px-[6px] py-[7px]">
          <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
          <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
          <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
        </div>
      ) : (
        <div className="w-full h-4" />
      )}
      <SidebarMenuHeader />
      <div className="flex flex-col gap-1 mt-2 w-full p-2 items-center flex-grow">
        <SidebarMenuIcon
          icon={MessageCircle}
          onClick={() => {
            onChange('chats');
          }}
          isActive={value === 'chats'}
          unreadState={chatsState}
        />
        <SidebarMenuIcon
          icon={LayoutGrid}
          onClick={() => {
            onChange('spaces');
          }}
          isActive={value === 'spaces'}
          unreadState={channelsState}
        />
      </div>
      <SidebarMenuFooter />
    </div>
  );
};
