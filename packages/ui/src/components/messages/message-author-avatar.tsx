import { LocalMessageNode } from '@colanode/client/types';
import { Avatar } from '@colanode/ui/components/avatars/avatar';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useQuery } from '@colanode/ui/hooks/use-query';

interface MessageAuthorAvatarProps {
  message: LocalMessageNode;
  className?: string;
}

export const MessageAuthorAvatar = ({
  message,
  className,
}: MessageAuthorAvatarProps) => {
  const workspace = useWorkspace();
  const userGetQuery = useQuery({
    type: 'user.get',
    accountId: workspace.accountId,
    workspaceId: workspace.id,
    userId: message.createdBy,
  });

  if (userGetQuery.isPending || !userGetQuery.data) {
    return null;
  }

  const user = userGetQuery.data;
  return (
    <Avatar
      id={user.id}
      name={user.name}
      avatar={user.avatar}
      size="medium"
      className={className}
    />
  );
};
