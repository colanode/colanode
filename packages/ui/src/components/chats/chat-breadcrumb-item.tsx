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

  const userGetQuery = useQuery({
    type: 'user.get',
    accountId: workspace.accountId,
    workspaceId: workspace.id,
    userId,
  });

  if (userGetQuery.isPending || !userGetQuery.data) {
    return null;
  }

  return (
    <div className="flex items-center space-x-2">
      <Avatar
        id={userGetQuery.data.id}
        name={userGetQuery.data.name}
        avatar={userGetQuery.data.avatar}
        className="size-4"
      />
      <span>{userGetQuery.data.name}</span>
    </div>
  );
};
