import { eq, useLiveQuery } from '@tanstack/react-db';

import { LocalChatNode } from '@colanode/client/types';
import { collections } from '@colanode/ui/collections';
import { BreadcrumbItem } from '@colanode/ui/components/layouts/containers/breadcrumb-item';
import { useWorkspace } from '@colanode/ui/contexts/workspace';

interface ChatBreadcrumbItemProps {
  chat: LocalChatNode;
}

export const ChatBreadcrumbItem = ({ chat }: ChatBreadcrumbItemProps) => {
  const workspace = useWorkspace();

  const collaboratorId =
    chat && chat.type === 'chat'
      ? (Object.keys(chat.attributes.collaborators).find(
          (id) => id !== workspace.userId
        ) ?? '')
      : '';

  const collaboratorQuery = useLiveQuery(
    (q) =>
      q
        .from({ users: collections.workspace(workspace.userId).users })
        .where(({ users }) => eq(users.id, collaboratorId))
        .select(({ users }) => ({
          id: users.id,
          name: users.name,
          avatar: users.avatar,
        }))
        .findOne(),
    [collaboratorId]
  );

  const collaborator = collaboratorQuery.data;
  if (!collaborator) {
    return null;
  }

  return (
    <BreadcrumbItem
      id={collaborator.id}
      avatar={collaborator.avatar}
      name={collaborator.name}
    />
  );
};
