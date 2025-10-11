import { LocalChatNode } from '@colanode/client/types';
import { Tab } from '@colanode/ui/components/layouts/tabs/tab';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useLiveQuery } from '@colanode/ui/hooks/use-live-query';

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

  const userGetQuery = useLiveQuery({
    type: 'user.get',
    userId: workspace.userId,
    id: userId,
  });

  if (userGetQuery.isPending || !userGetQuery.data) {
    return null;
  }

  const user = userGetQuery.data;

  return <Tab id={user.id} avatar={user.avatar} name={user.name} />;
};
