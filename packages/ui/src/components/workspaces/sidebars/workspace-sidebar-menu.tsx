import { LayoutGrid, MessageCircle, Settings } from 'lucide-react';

import { SidebarMenuType } from '@colanode/client/types';
import { WorkspaceSidebarMenuFooter } from '@colanode/ui/components/workspaces/sidebars/workspace-sidebar-menu-footer';
import { WorkspaceSidebarMenuHeader } from '@colanode/ui/components/workspaces/sidebars/workspace-sidebar-menu-header';
import { WorkspaceSidebarMenuIcon } from '@colanode/ui/components/workspaces/sidebars/workspace-sidebar-menu-icon';
import { useAppMetadata } from '@colanode/ui/contexts/app-metadata';
import { useRadar } from '@colanode/ui/contexts/radar';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useLiveQuery } from '@colanode/ui/hooks/use-live-query';

interface WorkspaceSidebarMenuProps {
  value: SidebarMenuType;
  onChange: (value: SidebarMenuType) => void;
}

export const WorkspaceSidebarMenu = ({
  value,
  onChange,
}: WorkspaceSidebarMenuProps) => {
  const appMetadata = useAppMetadata();
  const workspace = useWorkspace();
  const radar = useRadar();

  const platform = appMetadata.get('platform');
  const windowSize = appMetadata.get('window.size');
  const showMacOsPlaceholder = platform === 'darwin' && !windowSize?.fullscreen;

  const chatsState = radar.getChatsState(workspace.accountId, workspace.id);
  const channelsState = radar.getChannelsState(
    workspace.accountId,
    workspace.id
  );

  const pendingUploadsQuery = useLiveQuery({
    type: 'upload.list.pending',
    accountId: workspace.accountId,
    workspaceId: workspace.id,
    page: 1,
    count: 21,
  });

  const pendingUploads = pendingUploadsQuery.data ?? [];
  const pendingUploadsCount = pendingUploads.length;

  return (
    <div className="flex flex-col h-full w-[65px] min-w-[65px] items-center">
      {showMacOsPlaceholder ? (
        <div className="w-full h-8 flex gap-[8px] px-[6px] py-[7px]">
          <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
          <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
          <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
        </div>
      ) : (
        <div className="w-full h-4" />
      )}
      <WorkspaceSidebarMenuHeader />
      <div className="flex flex-col gap-1 mt-2 w-full p-2 items-center flex-grow">
        <WorkspaceSidebarMenuIcon
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
        <WorkspaceSidebarMenuIcon
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
        <WorkspaceSidebarMenuIcon
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
      <WorkspaceSidebarMenuFooter />
    </div>
  );
};
