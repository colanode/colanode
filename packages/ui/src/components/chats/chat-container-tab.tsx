import { eq, useLiveQuery } from '@tanstack/react-db';

import { ChatAttributes } from '@colanode/core';
import { collections } from '@colanode/ui/collections';
import { Avatar } from '@colanode/ui/components/avatars/avatar';
import { UnreadBadge } from '@colanode/ui/components/ui/unread-badge';
import { useRadar } from '@colanode/ui/contexts/radar';
import { useWorkspace } from '@colanode/ui/contexts/workspace';

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

  const nodeQuery = useLiveQuery((q) =>
    q
      .from({ nodes: collections.workspace(workspace.userId).nodes })
      .where(({ nodes }) => eq(nodes.id, chatId))
      .select(({ nodes }) => ({
        id: nodes.id,
        attributes: nodes.attributes,
      }))
      .findOne()
  );

  const chat = nodeQuery.data?.attributes as ChatAttributes;
  const userId = chat
    ? (Object.keys(chat.collaborators).find((id) => id !== workspace.userId) ??
      '')
    : '';

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

  if (!chat || !user) {
    return <p className="text-sm text-muted-foreground">Not found</p>;
  }

  const unreadState = radar.getNodeState(workspace.userId, chatId);

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
