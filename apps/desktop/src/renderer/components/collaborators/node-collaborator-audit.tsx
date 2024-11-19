import { useWorkspace } from '@/renderer/contexts/workspace';
import { useQuery } from '@/renderer/hooks/use-query';
import { Avatar } from '@/renderer/components/avatars/avatar';
import { timeAgo } from '@/shared/lib/utils';

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
    type: 'node_get',
    nodeId: collaboratorId,
    userId: workspace.userId,
  });

  if (isPending || !data || data.type !== 'user') {
    return null;
  }

  return (
    <div className="flex items-center gap-2 w-full">
      <Avatar
        id={data.id}
        name={data.attributes.name}
        avatar={data.attributes.avatar}
        className="size-7"
      />
      <div className="flex flex-col">
        <span className="font-medium flex-grow">{data.attributes.name}</span>
        <span className="text-xs text-muted-foreground">{timeAgo(date)}</span>
      </div>
    </div>
  );
};
