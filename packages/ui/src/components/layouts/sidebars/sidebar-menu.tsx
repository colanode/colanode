import { count, inArray, useLiveQuery } from '@tanstack/react-db';
import { LayoutGrid, MessageCircle, Settings } from 'lucide-react';

import { SidebarMenuType, UploadStatus } from '@colanode/client/types';
import { SidebarMenuFooter } from '@colanode/ui/components/layouts/sidebars/sidebar-menu-footer';
import { SidebarMenuHeader } from '@colanode/ui/components/layouts/sidebars/sidebar-menu-header';
import { SidebarMenuIcon } from '@colanode/ui/components/layouts/sidebars/sidebar-menu-icon';
import { useRadar } from '@colanode/ui/contexts/radar';
import { useWorkspace } from '@colanode/ui/contexts/workspace';

interface SidebarMenuProps {
  value: SidebarMenuType;
  onChange: (value: SidebarMenuType) => void;
}

export const SidebarMenu = ({ value, onChange }: SidebarMenuProps) => {
  const workspace = useWorkspace();
  const radar = useRadar();

  const chatsState = radar.getChatsState(workspace.userId);
  const channelsState = radar.getChannelsState(workspace.userId);

  const pendingUploadsQuery = useLiveQuery(
    (q) =>
      q
        .from({ uploads: workspace.collections.uploads })
        .where(({ uploads }) =>
          inArray(uploads.status, [
            UploadStatus.Pending,
            UploadStatus.Uploading,
          ])
        )
        .select(({ uploads }) => ({
          count: count(uploads.fileId),
        }))
        .findOne(),
    [workspace.userId]
  );

  const pendingUploads = pendingUploadsQuery.data?.count ?? 0;

  return (
    <div className="flex flex-col h-full w-[65px] min-w-[65px] items-center">
      <SidebarMenuHeader />
      <div className="flex flex-col gap-1 mt-2 w-full p-2 items-center grow">
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
            count: pendingUploads,
            unread: pendingUploads > 0,
            maxCount: 20,
            className: 'bg-blue-500',
          }}
        />
      </div>
      <SidebarMenuFooter />
    </div>
  );
};
