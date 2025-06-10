import { InView } from 'react-intersection-observer';

import { LocalChatNode } from '@colanode/client/types';
import { Avatar } from '@colanode/ui/components/avatars/avatar';
import { UnreadBadge } from '@colanode/ui/components/ui/unread-badge';
import { useLayout } from '@colanode/ui/contexts/layout';
import { useRadar } from '@colanode/ui/contexts/radar';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useQuery } from '@colanode/ui/hooks/use-query';
import { cn } from '@colanode/ui/lib/utils';

interface ChatSidebarItemProps {
  chat: LocalChatNode;
}

export const ChatSidebarItem = ({ chat }: ChatSidebarItemProps) => {
  const workspace = useWorkspace();
  const layout = useLayout();
  const radar = useRadar();

  const userId =
    Object.keys(chat.attributes.collaborators).find(
      (id) => id !== workspace.userId
    ) ?? '';

  const userGetQuery = useQuery({
    type: 'user.get',
    accountId: workspace.accountId,
    workspaceId: workspace.id,
    userId,
  });

  if (userGetQuery.isPending || !userGetQuery.data) {
    return null;
  }

  const user = userGetQuery.data;
  const unreadState = radar.getNodeState(
    workspace.accountId,
    workspace.id,
    chat.id
  );
  const isActive = layout.activeTab === chat.id;

  return (
    <InView
      rootMargin="20px"
      onChange={(inView) => {
        if (inView) {
          radar.markNodeAsSeen(workspace.accountId, workspace.id, chat.id);
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
