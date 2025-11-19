import { InView } from 'react-intersection-observer';

import { LocalChannelNode } from '@colanode/client/types';
import { Avatar } from '@colanode/ui/components/avatars/avatar';
import { UnreadBadge } from '@colanode/ui/components/ui/unread-badge';
import { useRadar } from '@colanode/ui/contexts/radar';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { cn } from '@colanode/ui/lib/utils';

interface ChannelSidebarItemProps {
  channel: LocalChannelNode;
  isActive: boolean;
}

export const ChannelSidebarItem = ({
  channel,
  isActive,
}: ChannelSidebarItemProps) => {
  const workspace = useWorkspace();
  const radar = useRadar();

  const unreadState = radar.getNodeState(workspace.userId, channel.id);

  return (
    <InView
      rootMargin="20px"
      onChange={(inView) => {
        if (inView) {
          radar.markNodeAsSeen(workspace.userId, channel.id);
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
          'line-clamp-1 w-full grow pl-2 text-left',
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
