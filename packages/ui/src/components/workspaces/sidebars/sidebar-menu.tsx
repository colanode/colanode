import { LayoutGrid, MessageCircle, Settings } from 'lucide-react';

import { SidebarMenuType, WindowSize } from '@colanode/client/types';
import { SidebarMenuFooter } from '@colanode/ui/components/workspaces/sidebars/sidebar-menu-footer';
import { SidebarMenuHeader } from '@colanode/ui/components/workspaces/sidebars/sidebar-menu-header';
import { SidebarMenuIcon } from '@colanode/ui/components/workspaces/sidebars/sidebar-menu-icon';
import { useRadar } from '@colanode/ui/contexts/radar';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useLiveQuery } from '@colanode/ui/hooks/use-live-query';
import { useMetadata } from '@colanode/ui/hooks/use-metadata';
import { cn } from '@colanode/ui/lib/utils';

interface SidebarMenuProps {
  value: SidebarMenuType;
  onChange: (value: SidebarMenuType) => void;
}

export const SidebarMenu = ({ value, onChange }: SidebarMenuProps) => {
  const workspace = useWorkspace();
  const radar = useRadar();

  const [platform] = useMetadata<string>('app', 'platform');
  const [windowSize] = useMetadata<WindowSize>('app', 'window.size');
  const showMacOsPlaceholder = platform === 'darwin' && !windowSize?.fullscreen;

  const chatsState = radar.getChatsState(workspace.userId);
  const channelsState = radar.getChannelsState(workspace.userId);

  const pendingUploadsQuery = useLiveQuery({
    type: 'upload.list.pending',
    userId: workspace.userId,
    page: 1,
    count: 21,
  });

  const pendingUploads = pendingUploadsQuery.data ?? [];
  const pendingUploadsCount = pendingUploads.length;

  return (
    <div className="flex flex-col h-full w-[65px] min-w-[65px] items-center">
      <div className={cn('w-full', showMacOsPlaceholder ? 'h-8' : 'h-4')} />
      <SidebarMenuHeader />
      <div className="flex flex-col gap-1 mt-2 w-full p-2 items-center flex-grow">
        <SidebarMenuIcon
          icon={MessageCircle}
          onClick={() => {
            onChange('chats');
          }}
          isActive={value === 'chats'}
          unreadBadge={{
            count: chatsState.unreadCount,
            unread: chatsState.hasUnread,
            maxCount: 99,
          }}
        />
        <SidebarMenuIcon
          icon={LayoutGrid}
          onClick={() => {
            onChange('spaces');
          }}
          isActive={value === 'spaces'}
          unreadBadge={{
            count: channelsState.unreadCount,
            unread: channelsState.hasUnread,
            maxCount: 99,
          }}
        />
        <div className="mt-auto" />
        <SidebarMenuIcon
          icon={Settings}
          onClick={() => {
            onChange('settings');
          }}
          className="mt-auto"
          isActive={value === 'settings'}
          unreadBadge={{
            count: pendingUploadsCount,
            unread: pendingUploadsCount > 0,
            maxCount: 20,
            className: 'bg-blue-500',
          }}
        />
      </div>
      <SidebarMenuFooter />
    </div>
  );
};
