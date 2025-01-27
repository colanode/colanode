import { MessageNode } from '@/shared/types/messages';
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
    type: 'user_get',
    accountId: workspace.accountId,
    workspaceId: workspace.id,
    userId: message.createdBy,
  });

  if (!data) {
    return null;
  }

  return <span className={cn('font-medium', className)}>{data.name}</span>;
};
