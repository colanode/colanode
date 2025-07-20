import { formatBytes } from '@colanode/core';
import { Avatar } from '@colanode/ui/components/avatars/avatar';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useQuery } from '@colanode/ui/hooks/use-query';
import { bigintToPercent } from '@colanode/ui/lib/utils';

interface WorkspaceStorageUserStatsProps {
  id: string;
  used: string;
  limit: string;
}

export const WorkspaceStorageUserStats = ({
  id,
  used,
  limit,
}: WorkspaceStorageUserStatsProps) => {
  const workspace = useWorkspace();

  const userQuery = useQuery({
    type: 'user.get',
    accountId: workspace.accountId,
    workspaceId: workspace.id,
    userId: id,
  });

  const name = userQuery.data?.name ?? 'Unknown';
  const email = userQuery.data?.email ?? ' ';
  const avatar = userQuery.data?.avatar ?? null;

  const usedBytes = BigInt(used);
  const limitBytes = BigInt(limit);
  const usedPercentage = limitBytes
    ? bigintToPercent(limitBytes, usedBytes)
    : 0;

  return (
    <div key={id} className="flex items-center space-x-3">
      <Avatar id={id} name={name} avatar={avatar} />
      <div className="flex-grow">
        <p className="text-sm font-medium leading-none">{name}</p>
        <p className="text-sm text-muted-foreground">{email}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium">{formatBytes(usedBytes)}</span> of{' '}
          <span className="font-medium">{formatBytes(limitBytes)}</span>
        </p>
        <p className="text-sm text-muted-foreground">
          ({usedPercentage.toFixed(2)}%)
        </p>
      </div>
    </div>
  );
};
