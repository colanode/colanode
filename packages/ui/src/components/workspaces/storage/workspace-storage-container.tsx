import { Container } from '@colanode/ui/components/layouts/containers/container';
import { WorkspaceStorageBreadcrumb } from '@colanode/ui/components/workspaces/storage/workspace-storage-breadcrumb';
import { WorkspaceStorageStats } from '@colanode/ui/components/workspaces/storage/workspace-storage-stats';
import { WorkspaceStorageUsers } from '@colanode/ui/components/workspaces/storage/workspace-storage-users';

export const WorkspaceStorageContainer = () => {
  return (
    <Container type="full" breadcrumb={<WorkspaceStorageBreadcrumb />}>
      <div className="max-w-4xl space-y-10">
        <WorkspaceStorageStats />
        <WorkspaceStorageUsers />
      </div>
    </Container>
  );
};
