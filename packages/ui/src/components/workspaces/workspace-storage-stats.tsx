import { Separator } from '@colanode/ui/components/ui/separator';
import { StorageStats } from '@colanode/ui/components/workspaces/storage-stats';
import { WorkspaceStorageUserTable } from '@colanode/ui/components/workspaces/workspace-storage-user-table';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useQuery } from '@colanode/ui/hooks/use-query';

export const WorkspaceStorageStats = () => {
  const workspace = useWorkspace();

  const workspaceStorageGetQuery = useQuery({
    type: 'workspace.storage.get',
    accountId: workspace.accountId,
    workspaceId: workspace.id,
  });

  const data = workspaceStorageGetQuery.data ?? {
    limit: '0',
    used: '0',
    subtypes: [],
    users: [],
  };
  const usedBytes = BigInt(data.used);
  const limitBytes = data.limit ? BigInt(data.limit) : null;

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">
          Workspace storage
        </h2>
        <Separator className="mt-3" />
      </div>
      <StorageStats
        usedBytes={usedBytes}
        limitBytes={limitBytes}
        subtypes={data.subtypes}
        isLoading={workspaceStorageGetQuery.isPending}
      />
      <WorkspaceStorageUserTable
        users={data.users}
        isLoading={workspaceStorageGetQuery.isPending}
        onUpdate={() => {
          workspaceStorageGetQuery.refetch();
        }}
      />
    </div>
  );
};
