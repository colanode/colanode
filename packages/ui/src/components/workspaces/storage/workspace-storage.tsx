import { Container, ContainerBody } from '@colanode/ui/components/ui/container';
import { UserStorageStats } from '@colanode/ui/components/workspaces/storage/user-storage-stats';
import { WorkspaceStorageStats } from '@colanode/ui/components/workspaces/storage/workspace-storage-stats';
import { useWorkspace } from '@colanode/ui/contexts/workspace';

export const WorkspaceStorage = () => {
  const workspace = useWorkspace();
  const canManageStorage =
    workspace.role === 'owner' || workspace.role === 'admin';

  return (
    <Container>
      <ContainerBody className="max-w-4xl space-y-10">
        <UserStorageStats />
        {canManageStorage && <WorkspaceStorageStats />}
      </ContainerBody>
    </Container>
  );
};
