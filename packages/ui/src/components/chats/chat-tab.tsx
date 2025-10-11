import { eq, useLiveQuery } from '@tanstack/react-db';

import { LocalChatNode } from '@colanode/client/types';
import { Tab } from '@colanode/ui/components/layouts/tabs/tab';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { database } from '@colanode/ui/data';

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

  if (!user) {
    return null;
  }

  return <Tab id={user.id} avatar={user.avatar} name={user.name} />;
};
