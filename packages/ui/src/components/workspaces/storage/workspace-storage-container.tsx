import { WorkspaceStorageStats } from '@colanode/ui/components/workspaces/storage/workspace-storage-stats';
import { WorkspaceStorageUsers } from '@colanode/ui/components/workspaces/storage/workspace-storage-users';

export const WorkspaceStorageContainer = () => {
  return (
    <div className="max-w-4xl space-y-10">
      <WorkspaceStorageStats />
      <WorkspaceStorageUsers />
    </div>
  );
};
