import { InView } from 'react-intersection-observer';

import { LocalChannelNode } from '@colanode/client/types';
import { Avatar } from '@colanode/ui/components/avatars/avatar';
import { UnreadBadge } from '@colanode/ui/components/ui/unread-badge';
import { useLayout } from '@colanode/ui/contexts/layout';
import { useRadar } from '@colanode/ui/contexts/radar';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { cn } from '@colanode/ui/lib/utils';

interface ChannelSidebarItemProps {
  channel: LocalChannelNode;
}

export const ChannelSidebarItem = ({ channel }: ChannelSidebarItemProps) => {
  const workspace = useWorkspace();
  const layout = useLayout();
  const radar = useRadar();

  const isActive = layout.activeTab === channel.id;
  const unreadState = radar.getNodeState(
    workspace.accountId,
    workspace.id,
    channel.id
  );

  return (
    <InView
      rootMargin="20px"
      onChange={(inView) => {
        if (inView) {
          radar.markNodeAsSeen(workspace.accountId, workspace.id, channel.id);
        }
      }}
      className={cn(
        'flex w-full items-center cursor-pointer',
        isActive && 'bg-sidebar-accent'
      )}
    >
      <Avatar
        id={channel.id}
        avatar={channel.attributes.avatar}
        name={channel.attributes.name}
        className="h-4 w-4"
      />
      <span
        className={cn(
          'line-clamp-1 w-full flex-grow pl-2 text-left',
          !isActive && unreadState.hasUnread && 'font-semibold'
        )}
      >
        {channel.attributes.name ?? 'Unnamed'}
      </span>
      {!isActive && (
        <UnreadBadge
          count={unreadState.unreadCount}
          unread={unreadState.hasUnread}
        />
      )}
    </InView>
  );
};
