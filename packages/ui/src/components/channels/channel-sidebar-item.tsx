import { InView } from 'react-intersection-observer';

import { LocalChannelNode } from '@colanode/client/types';
import { Avatar } from '@colanode/ui/components/avatars/avatar';
import { Link } from '@colanode/ui/components/ui/link';
import { UnreadBadge } from '@colanode/ui/components/ui/unread-badge';
import { useRadar } from '@colanode/ui/contexts/radar';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { cn } from '@colanode/ui/lib/utils';

interface ChannelSidebarItemProps {
  channel: LocalChannelNode;
}

export const ChannelSidebarItem = ({ channel }: ChannelSidebarItemProps) => {
  const workspace = useWorkspace();
  const radar = useRadar();

  const unreadState = radar.getNodeState(workspace.userId, channel.id);

  return (
    <Link
      from="/workspace/$userId"
      to="$nodeId"
      params={{ nodeId: channel.id }}
    >
      {({ isActive }) => (
        <InView
          rootMargin="20px"
          onChange={(inView) => {
            if (inView) {
              radar.markNodeAsSeen(workspace.userId, channel.id);
            }
          }}
          className={cn(
            'text-sm flex h-7 min-w-0 items-center gap-2 rounded-md px-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer',
            isActive &&
              'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
          )}
        >
          <Avatar
            id={channel.id}
            avatar={channel.avatar}
            name={channel.name}
            className="size-4 shrink-0"
          />
          <span
            className={cn(
              'line-clamp-1 w-full grow text-left',
              !isActive && unreadState.hasUnread && 'font-semibold'
            )}
          >
            {channel.name ?? 'Unnamed'}
          </span>
          {!isActive && (
            <UnreadBadge
              count={unreadState.unreadCount}
              unread={unreadState.hasUnread}
            />
          )}
        </InView>
      )}
    </Link>
  );
};
