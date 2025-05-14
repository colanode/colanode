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
  const { data, isPending } = useQuery({
    type: 'user_get',
    accountId: workspace.accountId,
    workspaceId: workspace.id,
    userId: collaboratorId,
  });

  if (isPending || !data) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 w-full">
      <Avatar
        id={data.id}
        name={data.name}
        avatar={data.avatar}
        className="size-7"
      />
      <div className="flex flex-col">
        <span className="font-normal flex-grow">{data.name}</span>
        <span className="text-xs text-muted-foreground">{timeAgo(date)}</span>
      </div>
    </div>
  );
};
