import { LocalMessageNode } from '@colanode/client/types';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useLiveQuery } from '@colanode/ui/hooks/use-live-query';
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

  const userGetQuery = useLiveQuery({
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
    <span className={cn('font-medium text-foreground', className)}>
      {user.name}
    </span>
  );
};
