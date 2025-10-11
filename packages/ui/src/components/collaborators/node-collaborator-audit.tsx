import { eq, useLiveQuery } from '@tanstack/react-db';

import { timeAgo } from '@colanode/core';
import { Avatar } from '@colanode/ui/components/avatars/avatar';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { database } from '@colanode/ui/data';

interface NodeCollaboratorAuditProps {
  collaboratorId: string;
  date: string;
}

export const NodeCollaboratorAudit = ({
  collaboratorId,
  date,
}: NodeCollaboratorAuditProps) => {
  const workspace = useWorkspace();

  const userQuery = useLiveQuery((q) =>
    q
      .from({ users: database.workspace(workspace.userId).users })
      .where(({ users }) => eq(users.id, collaboratorId))
      .select(({ users }) => ({
        id: users.id,
        name: users.name,
        avatar: users.avatar,
      }))
      .findOne()
  );
  const user = userQuery.data;
  if (!user) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 w-full">
      <Avatar
        id={user.id}
        name={user.name}
        avatar={user.avatar}
        className="size-7"
      />
      <div className="flex flex-col">
        <span className="font-normal flex-grow">{user.name}</span>
        <span className="text-xs text-muted-foreground">{timeAgo(date)}</span>
      </div>
    </div>
  );
};
