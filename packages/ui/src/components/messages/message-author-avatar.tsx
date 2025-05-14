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
  const { data } = useQuery({
    type: 'user_get',
    accountId: workspace.accountId,
    workspaceId: workspace.id,
    userId: message.createdBy,
  });

  if (!data) {
    return null;
  }

  return (
    <Avatar
      id={data.id}
      name={data.name}
      avatar={data.avatar}
      size="medium"
      className={className}
    />
  );
};
