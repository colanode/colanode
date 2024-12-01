import { MessageNode, UserNode } from '@colanode/core';

import { Avatar } from '@/renderer/components/avatars/avatar';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useQuery } from '@/renderer/hooks/use-query';

interface MessageAuthorAvatarProps {
  message: MessageNode;
  className?: string;
}

export const MessageAuthorAvatar = ({
  message,
  className,
}: MessageAuthorAvatarProps) => {
  const workspace = useWorkspace();
  const { data } = useQuery({
    type: 'node_get',
    nodeId: message.createdBy,
    userId: workspace.userId,
  });

  if (!data || data.type !== 'user') {
    return null;
  }

  const author = data as UserNode;

  return (
    <Avatar
      id={author.id}
      name={author.attributes.name}
      avatar={author.attributes.avatar}
      size="medium"
      className={className}
    />
  );
};
