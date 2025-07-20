import { Container, ContainerBody } from '@colanode/ui/components/ui/container';
import { UserStorageStats } from '@colanode/ui/components/workspaces/user-storage-stats';
import { WorkspaceStorageStats } from '@colanode/ui/components/workspaces/workspace-storage-stats';
import { useWorkspace } from '@colanode/ui/contexts/workspace';

export const WorkspaceStorage = () => {
  const workspace = useWorkspace();
  const isOwner = workspace.role === 'owner';

  return (
    <Container>
      <ContainerBody className="max-w-4xl space-y-10">
        <UserStorageStats />
        {isOwner && <WorkspaceStorageStats />}
      </ContainerBody>
    </Container>
  );
};
