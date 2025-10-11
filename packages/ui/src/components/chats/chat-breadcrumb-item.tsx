import { LocalChatNode } from '@colanode/client/types';
import { Avatar } from '@colanode/ui/components/avatars/avatar';
import { BreadcrumbItem } from '@colanode/ui/components/workspaces/breadcrumbs/breadcrumb-item';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useLiveQuery } from '@colanode/ui/hooks/use-live-query';

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

  const userGetQuery = useLiveQuery({
    type: 'user.get',
    userId: workspace.userId,
    id: userId,
  });

  if (userGetQuery.isPending || !userGetQuery.data) {
    return null;
  }

  return (
    <BreadcrumbItem
      icon={(className) => (
        <Avatar
          id={userGetQuery.data!.id}
          name={userGetQuery.data!.name}
          avatar={userGetQuery.data!.avatar}
          className={className}
        />
      )}
      name={userGetQuery.data!.name}
    />
  );
};
