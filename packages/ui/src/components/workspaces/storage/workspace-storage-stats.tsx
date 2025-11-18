import { BadgeAlert } from 'lucide-react';

import { Button } from '@colanode/ui/components/ui/button';
import { Spinner } from '@colanode/ui/components/ui/spinner';
import { StorageStats } from '@colanode/ui/components/workspaces/storage/storage-stats';
import { WorkspaceStorageCloud } from '@colanode/ui/components/workspaces/storage/workspace-storage-cloud';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useQuery } from '@colanode/ui/hooks/use-query';

export const WorkspaceStorageStats = () => {
  const workspace = useWorkspace();
  const canManageStorage =
    workspace.role === 'owner' || workspace.role === 'admin';

  const storageQuery = useQuery({
    type: 'workspace.storage.get',
    userId: workspace.userId,
  });

  const showUserError = storageQuery.isError || !storageQuery.data?.user;
  const showWorkspaceError =
    storageQuery.isError || !storageQuery.data?.workspace;

  return (
    <div className="max-w-4xl space-y-10">
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">My storage</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your personal storage usage.
          </p>
        </div>
        {storageQuery.isPending ? (
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Spinner className="size-5" />
            <span>Loading storage data from the server...</span>
          </div>
        ) : showUserError ? (
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Couldn't load your storage information. Please try again.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => storageQuery.refetch()}
            >
              Try again
            </Button>
          </div>
        ) : storageQuery.data?.user?.usage ? (
          <StorageStats
            storageLimit={storageQuery.data.user.storageLimit}
            usage={storageQuery.data.user.usage}
          />
        ) : null}
      </div>
      {canManageStorage && (
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Workspace storage
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Total storage usage for the workspace.
            </p>
          </div>
          {storageQuery.isPending ? (
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Spinner className="size-5" />
              <span>Loading storage data from the server...</span>
            </div>
          ) : showWorkspaceError ? (
            <div className="flex flex-col gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-4">
                <BadgeAlert className="size-8 text-red-400" />
                <span>
                  Couldn't load workspace storage information. Please try again.
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => storageQuery.refetch()}
              >
                Retry
              </Button>
            </div>
          ) : storageQuery.data?.workspace?.usage ? (
            <>
              <StorageStats
                storageLimit={storageQuery.data.workspace.storageLimit ?? null}
                usage={storageQuery.data.workspace.usage}
              />
              <WorkspaceStorageCloud />
            </>
          ) : null}
        </div>
      )}
    </div>
  );
};
