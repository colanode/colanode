import { eq, useLiveQuery } from '@tanstack/react-db';

import { LocalChatNode } from '@colanode/client/types';
import { collections } from '@colanode/ui/collections';
import { Tab } from '@colanode/ui/components/layouts/tabs/tab';

interface ChatTabProps {
  userId: string;
  chat: LocalChatNode;
}

export const ChatTab = ({ userId, chat }: ChatTabProps) => {
  const otherUserId =
    chat.type === 'chat'
      ? (Object.keys(chat.attributes.collaborators).find(
          (id) => id !== userId
        ) ?? '')
      : '';

  const userQuery = useLiveQuery((q) =>
    q
      .from({ users: collections.workspace(userId).users })
      .where(({ users }) => eq(users.id, otherUserId))
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
