import { Separator } from '@colanode/ui/components/ui/separator';
import { StorageStats } from '@colanode/ui/components/workspaces/storage/storage-stats';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useLiveQuery } from '@colanode/ui/hooks/use-live-query';

export const UserStorageStats = () => {
  const workspace = useWorkspace();

  const userStorageGetQuery = useLiveQuery({
    type: 'user.storage.get',
    accountId: workspace.accountId,
    workspaceId: workspace.id,
  });

  const data = userStorageGetQuery.data ?? {
    storageLimit: '0',
    storageUsed: '0',
    subtypes: [],
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">My storage</h2>
        <Separator className="mt-3" />
      </div>
      {userStorageGetQuery.isPending ? (
        <div className="text-sm text-muted-foreground">
          Loading storage data...
        </div>
      ) : (
        <StorageStats
          storageUsed={data.storageUsed}
          storageLimit={data.storageLimit}
          subtypes={data.subtypes}
        />
      )}
    </div>
  );
};
