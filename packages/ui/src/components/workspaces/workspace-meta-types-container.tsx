import { Container } from '@colanode/ui/components/layouts/containers/container';
import { Separator } from '@colanode/ui/components/ui/separator';
import { WorkspaceMetaTypes } from '@colanode/ui/components/workspaces/workspace-meta-types';
import { WorkspaceMetaTypesBreadcrumb } from '@colanode/ui/components/workspaces/workspace-meta-types-breadcrumb';
import { useWorkspace } from '@colanode/ui/contexts/workspace';

export const WorkspaceMetaTypesContainer = () => {
  const workspace = useWorkspace();
  const canEdit = workspace.role === 'owner';

  return (
    <Container type="full" breadcrumb={<WorkspaceMetaTypesBreadcrumb />}>
      <div className="max-w-4xl space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Meta Types</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Define page property schemas shared across all spaces in this workspace.
          </p>
          <Separator className="mt-3" />
        </div>
        <WorkspaceMetaTypes userId={workspace.userId} canEdit={canEdit} />
      </div>
    </Container>
  );
};
