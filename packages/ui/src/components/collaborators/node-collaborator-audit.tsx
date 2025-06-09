import { timeAgo } from '@colanode/core';
import { Avatar } from '@colanode/ui/components/avatars/avatar';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useQuery } from '@colanode/ui/hooks/use-query';

interface NodeCollaboratorAuditProps {
  collaboratorId: string;
  date: string;
}

export const NodeCollaboratorAudit = ({
  collaboratorId,
  date,
}: NodeCollaboratorAuditProps) => {
  const workspace = useWorkspace();

  const userGetQuery = useQuery({
    type: 'user.get',
    accountId: workspace.accountId,
    workspaceId: workspace.id,
    userId: collaboratorId,
  });

  if (userGetQuery.isPending || !userGetQuery.data) {
    return null;
  }

  const user = userGetQuery.data;
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
