import { eq, useLiveQuery } from '@tanstack/react-db';

import { LocalMessageNode } from '@colanode/client/types';
import { collections } from '@colanode/ui/collections';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
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

  const userQuery = useLiveQuery((q) =>
    q
      .from({ users: collections.workspace(workspace.userId).users })
      .where(({ users }) => eq(users.id, message.createdBy))
      .select(({ users }) => ({
        name: users.name,
      }))
      .findOne()
  );

  const user = userQuery.data;
  if (!user) {
    return null;
  }

  return (
    <span className={cn('font-medium text-foreground', className)}>
      {user.name}
    </span>
  );
};
