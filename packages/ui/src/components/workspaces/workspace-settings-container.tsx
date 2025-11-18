import { eq, useLiveQuery } from '@tanstack/react-db';
import { toast } from 'sonner';

import { collections } from '@colanode/ui/collections';
import { Container } from '@colanode/ui/components/layouts/containers/container';
import { Separator } from '@colanode/ui/components/ui/separator';
import { WorkspaceDelete } from '@colanode/ui/components/workspaces/workspace-delete';
import { WorkspaceForm } from '@colanode/ui/components/workspaces/workspace-form';
import { WorkspaceNotFound } from '@colanode/ui/components/workspaces/workspace-not-found';
import { WorkspaceSettingsBreadcrumb } from '@colanode/ui/components/workspaces/workspace-settings-breadcrumb';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useMutation } from '@colanode/ui/hooks/use-mutation';

export const WorkspaceSettingsContainer = () => {
  const workspace = useWorkspace();
  const { mutate, isPending } = useMutation();

  const currentWorkspaceQuery = useLiveQuery((q) =>
    q
      .from({ workspaces: collections.workspaces })
      .where(({ workspaces }) => eq(workspaces.accountId, workspace.accountId))
      .select(({ workspaces }) => ({
        name: workspaces.name,
        description: workspaces.description,
        avatar: workspaces.avatar,
      }))
  );

  const currentWorkspace = currentWorkspaceQuery.data?.[0];
  const canEdit = workspace.role === 'owner';

  if (!currentWorkspace) {
    return <WorkspaceNotFound />;
  }

  return (
    <Container type="full" breadcrumb={<WorkspaceSettingsBreadcrumb />}>
      <div className="max-w-4xl space-y-8">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">General</h2>
            <Separator className="mt-3" />
          </div>
          <WorkspaceForm
            readOnly={!canEdit}
            values={{
              name: currentWorkspace.name,
              description: currentWorkspace.description ?? '',
              avatar: currentWorkspace.avatar ?? null,
            }}
            onSubmit={(values) => {
              mutate({
                input: {
                  type: 'workspace.update',
                  id: workspace.workspaceId,
                  userId: workspace.userId,
                  name: values.name,
                  description: values.description,
                  avatar: values.avatar ?? null,
                },
                onSuccess() {
                  toast.success('Workspace updated');
                },
                onError(error) {
                  toast.error(error.message);
                },
              });
            }}
            isSaving={isPending}
            saveText="Update"
          />
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Danger Zone
            </h2>
            <Separator className="mt-3" />
          </div>
          <WorkspaceDelete />
        </div>
      </div>
    </Container>
  );
};
