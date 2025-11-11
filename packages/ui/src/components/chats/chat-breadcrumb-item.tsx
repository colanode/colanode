import { eq, useLiveQuery } from '@tanstack/react-db';

import { LocalChatNode } from '@colanode/client/types';
import { collections } from '@colanode/ui/collections';
import { Avatar } from '@colanode/ui/components/avatars/avatar';
import { BreadcrumbItem } from '@colanode/ui/components/workspaces/breadcrumbs/breadcrumb-item';
import { useWorkspace } from '@colanode/ui/contexts/workspace';

interface ChatBreadcrumbItemProps {
  chat: LocalChatNode;
}

export const ChatBreadcrumbItem = ({ chat }: ChatBreadcrumbItemProps) => {
  const workspace = useWorkspace();

  const userId =
    chat && chat.type === 'chat'
      ? (Object.keys(chat.attributes.collaborators).find(
          (id) => id !== workspace.userId
        ) ?? '')
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
  if (!user) {
    return null;
  }

  return (
    <BreadcrumbItem
      icon={(className) => (
        <Avatar
          id={user.id}
          name={user.name}
          avatar={user.avatar}
          className={className}
        />
      )}
      name={user.name}
    />
  );
};
