import { MessageNode, UserNode } from '@colanode/core';

import { useWorkspace } from '@/renderer/contexts/workspace';
import { useQuery } from '@/renderer/hooks/use-query';
import { cn } from '@/shared/lib/utils';

interface MessageAuthorNameProps {
  message: MessageNode;
  className?: string;
}

export const MessageAuthorName = ({
  message,
  className,
}: MessageAuthorNameProps) => {
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
    <span className={cn('font-medium', className)}>
      {author.attributes.name}
    </span>
  );
};
