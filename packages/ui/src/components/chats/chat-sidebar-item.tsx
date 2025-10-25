import { eq, useLiveQuery } from '@tanstack/react-db';
import { InView } from 'react-intersection-observer';

import { LocalChatNode } from '@colanode/client/types';
import { collections } from '@colanode/ui/collections';
import { Avatar } from '@colanode/ui/components/avatars/avatar';
import { UnreadBadge } from '@colanode/ui/components/ui/unread-badge';
import { useRadar } from '@colanode/ui/contexts/radar';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { cn } from '@colanode/ui/lib/utils';

interface ChatSidebarItemProps {
  chat: LocalChatNode;
  isActive: boolean;
}

export const ChatSidebarItem = ({ chat, isActive }: ChatSidebarItemProps) => {
  const workspace = useWorkspace();
  const radar = useRadar();

  const userId =
    Object.keys(chat.attributes.collaborators).find(
      (id) => id !== workspace.userId
    ) ?? '';

  const userQuery = useLiveQuery((q) =>
    q
      .from({ users: collections.workspace(workspace.userId).users })
      .where(({ users }) => eq(users.id, userId))
      .select(({ users }) => ({
        id: users.id,
        name: users.name,
        avatar: users.avatar,
      }))
      .findOne()
  );

  const user = userQuery.data;
  if (!user) {
    return null;
  }

  const unreadState = radar.getNodeState(workspace.userId, chat.id);

  return (
    <InView
      rootMargin="20px"
      onChange={(inView) => {
        if (inView) {
          radar.markNodeAsSeen(workspace.userId, chat.id);
        }
      }}
      className={cn(
        'flex w-full items-center cursor-pointer',
        isActive && 'bg-sidebar-accent'
      )}
    >
      <Avatar
        id={user.id}
        avatar={user.avatar}
        name={user.name}
        className="h-5 w-5"
      />
      <span
        className={cn(
          'line-clamp-1 w-full flex-grow pl-2 text-left',
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
  );
};
