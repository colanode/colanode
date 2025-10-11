import { eq, useLiveQuery as useLiveQueryTanstack } from '@tanstack/react-db';

import { LocalChatNode } from '@colanode/client/types';
import { Avatar } from '@colanode/ui/components/avatars/avatar';
import { UnreadBadge } from '@colanode/ui/components/ui/unread-badge';
import { useRadar } from '@colanode/ui/contexts/radar';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { database } from '@colanode/ui/data';
import { useLiveQuery } from '@colanode/ui/hooks/use-live-query';

interface ChatContainerTabProps {
  chatId: string;
  isActive: boolean;
}

export const ChatContainerTab = ({
  chatId,
  isActive,
}: ChatContainerTabProps) => {
  const workspace = useWorkspace();
  const radar = useRadar();

  const nodeGetQuery = useLiveQuery({
    type: 'node.get',
    nodeId: chatId,
    userId: workspace.userId,
  });

  const chat = nodeGetQuery.data as LocalChatNode;
  const userId = chat
    ? (Object.keys(chat.attributes.collaborators).find(
        (id) => id !== workspace.userId
      ) ?? '')
    : '';

  const userQuery = useLiveQueryTanstack((q) =>
    q
      .from({ users: database.workspace(workspace.userId).users })
      .where(({ users }) => eq(users.id, userId))
      .select(({ users }) => ({
        id: users.id,
        name: users.name,
        avatar: users.avatar,
      }))
      .findOne()
  );
  const user = userQuery.data;

  if (nodeGetQuery.isPending || userQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }

  if (!chat || !user) {
    return <p className="text-sm text-muted-foreground">Not found</p>;
  }

  const unreadState = radar.getNodeState(workspace.userId, chat.id);

  return (
    <div className="flex items-center space-x-2">
      <Avatar size="small" id={user.id} name={user.name} avatar={user.avatar} />
      <span>{user.name}</span>
      {!isActive && (
        <UnreadBadge
          count={unreadState.unreadCount}
          unread={unreadState.hasUnread}
        />
      )}
    </div>
  );
};
