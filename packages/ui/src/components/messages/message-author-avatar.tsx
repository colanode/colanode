import { eq, useLiveQuery } from '@tanstack/react-db';

import { LocalMessageNode } from '@colanode/client/types';
import { collections } from '@colanode/ui/collections';
import { Avatar } from '@colanode/ui/components/avatars/avatar';
import { useWorkspace } from '@colanode/ui/contexts/workspace';

interface MessageAuthorAvatarProps {
  message: LocalMessageNode;
  className?: string;
}

export const MessageAuthorAvatar = ({
  message,
  className,
}: MessageAuthorAvatarProps) => {
  const workspace = useWorkspace();
  const userQuery = useLiveQuery(
    (q) =>
      q
        .from({ users: collections.workspace(workspace.userId).users })
        .where(({ users }) => eq(users.id, message.createdBy))
        .select(({ users }) => ({
          id: users.id,
          name: users.name,
          avatar: users.avatar,
        }))
        .findOne(),
    [workspace.userId, message.createdBy]
  );

  const user = userQuery.data;
  if (!user) {
    return null;
  }

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
