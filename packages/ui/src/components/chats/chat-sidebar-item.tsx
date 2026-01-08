import { eq, useLiveQuery } from '@tanstack/react-db';
import { InView } from 'react-intersection-observer';

import { LocalChatNode } from '@colanode/client/types';
import { Avatar } from '@colanode/ui/components/avatars/avatar';
import { Link } from '@colanode/ui/components/ui/link';
import { UnreadBadge } from '@colanode/ui/components/ui/unread-badge';
import { useRadar } from '@colanode/ui/contexts/radar';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { cn } from '@colanode/ui/lib/utils';

interface ChatSidebarItemProps {
  chat: LocalChatNode;
}

export const ChatSidebarItem = ({ chat }: ChatSidebarItemProps) => {
  const workspace = useWorkspace();
  const radar = useRadar();

  const userId =
    Object.keys(chat.collaborators).find((id) => id !== workspace.userId) ?? '';

  const userQuery = useLiveQuery(
    (q) =>
      q
        .from({ users: workspace.collections.users })
        .where(({ users }) => eq(users.id, userId))
        .select(({ users }) => ({
          id: users.id,
          name: users.name,
          avatar: users.avatar,
        }))
        .findOne(),
    [userId]
  );

  const user = userQuery.data;
  if (!user) {
    return null;
  }

  const unreadState = radar.getNodeState(workspace.userId, chat.id);

  return (
    <Link from="/workspace/$userId" to="$nodeId" params={{ nodeId: chat.id }}>
      {({ isActive }) => (
        <InView
          rootMargin="20px"
          onChange={(inView) => {
            if (inView) {
              radar.markNodeAsSeen(workspace.userId, chat.id);
            }
          }}
          className={cn(
            'text-sm flex h-7 min-w-0 items-center gap-2 rounded-md px-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer',
            isActive &&
              'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
          )}
        >
          <Avatar
            id={user.id}
            avatar={user.avatar}
            name={user.name}
            className="size-5"
          />
          <span
            className={cn(
              'line-clamp-1 w-full grow text-left',
              !isActive && unreadState.hasUnread && 'font-semibold'
            )}
          >
            {user.name ?? 'Unnamed'}
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
