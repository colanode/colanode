import { BadgeAlert } from 'lucide-react';
import { match } from 'ts-pattern';

import { Separator } from '@colanode/ui/components/ui/separator';
import { Spinner } from '@colanode/ui/components/ui/spinner';
import { StorageStats } from '@colanode/ui/components/workspaces/storage/storage-stats';
import { WorkspaceStorageCloud } from '@colanode/ui/components/workspaces/storage/workspace-storage-cloud';
import { WorkspaceStorageUserTable } from '@colanode/ui/components/workspaces/storage/workspace-storage-user-table';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useQuery } from '@colanode/ui/hooks/use-query';

export const WorkspaceStorageStats = () => {
  const workspace = useWorkspace();

  const workspaceStorageGetQuery = useQuery({
    type: 'workspace.storage.get',
    userId: workspace.userId,
  });

  const data = workspaceStorageGetQuery.data ?? {
    storageLimit: '0',
    storageUsed: '0',
    subtypes: [],
    users: [],
  };

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">
          Workspace storage
        </h2>
        <Separator className="mt-3" />
      </div>
      {match(workspaceStorageGetQuery)
        .with({ isPending: true }, () => (
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Spinner className="size-5" />
            <span>Loading storage data from the server...</span>
          </div>
        ))
        .with({ isPending: false, isError: false }, () => (
          <>
            <StorageStats
              storageUsed={data.storageUsed}
              storageLimit={data.storageLimit ?? null}
              subtypes={data.subtypes}
            />
            <WorkspaceStorageCloud />
            <Separator className="my-4" />
            <WorkspaceStorageUserTable
              users={data.users}
              onUpdate={() => {
                workspaceStorageGetQuery.refetch();
              }}
            />
          </>
        ))
        .otherwise(() => (
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <BadgeAlert className="size-8 text-red-400" />
            <span>
              Couldn't load storage information from the server. Please make
              sure that the server is accessible and you have permission to
              access this workspace storage data.
            </span>
          </div>
        ))}
    </div>
  );
};
