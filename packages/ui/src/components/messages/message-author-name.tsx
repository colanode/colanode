import { LocalMessageNode } from '@colanode/client/types';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useQuery } from '@colanode/ui/hooks/use-query';
import { cn } from '@colanode/ui/lib/utils';

interface MessageAuthorNameProps {
  message: LocalMessageNode;
  className?: string;
}

export const MessageAuthorName = ({
  message,
  className,
}: MessageAuthorNameProps) => {
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
  return <span className={cn('font-medium', className)}>{user.name}</span>;
};
