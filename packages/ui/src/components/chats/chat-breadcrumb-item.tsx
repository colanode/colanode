import { LocalChatNode } from '@colanode/client/types';
import { Avatar } from '@colanode/ui/components/avatars/avatar';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useQuery } from '@colanode/ui/hooks/use-query';

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

  const { data: user } = useQuery({
    type: 'user_get',
    accountId: workspace.accountId,
    workspaceId: workspace.id,
    userId,
  });

  if (!user) {
    return null;
  }

  return (
    <div className="flex items-center space-x-2">
      <Avatar
        id={user.id}
        name={user.name}
        avatar={user.avatar}
        className="size-4"
      />
      <span>{user.name}</span>
    </div>
  );
};
