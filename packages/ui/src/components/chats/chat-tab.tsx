import { eq, useLiveQuery } from '@tanstack/react-db';

import { LocalChatNode } from '@colanode/client/types';
import { collections } from '@colanode/ui/collections';
import { Tab } from '@colanode/ui/components/layouts/tabs/tab';
import { useWorkspace } from '@colanode/ui/contexts/workspace';

interface ChatTabProps {
  chat: LocalChatNode;
}

export const ChatTab = ({ chat }: ChatTabProps) => {
  const workspace = useWorkspace();

  const userId =
    chat.type === 'chat'
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

  return <Tab id={user.id} avatar={user.avatar} name={user.name} />;
};
