import { Container } from '@colanode/ui/components/layouts/containers/container';
import { Separator } from '@colanode/ui/components/ui/separator';
import { WorkspaceTags } from '@colanode/ui/components/workspaces/workspace-tags';
import { WorkspaceTagsBreadcrumb } from '@colanode/ui/components/workspaces/workspace-tags-breadcrumb';
import { useWorkspace } from '@colanode/ui/contexts/workspace';

export const WorkspaceTagsContainer = () => {
  const workspace = useWorkspace();
  const canEdit = workspace.role === 'owner';

  return (
    <Container type="full" breadcrumb={<WorkspaceTagsBreadcrumb />}>
      <div className="max-w-4xl space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Tags</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage tags shared across all spaces in this workspace.
          </p>
          <Separator className="mt-3" />
        </div>
        <WorkspaceTags userId={workspace.userId} canEdit={canEdit} />
      </div>
    </Container>
  );
};
