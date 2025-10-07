import { eq, useLiveQuery } from '@tanstack/react-db';
import { Settings } from 'lucide-react';
import { toast } from 'sonner';

import { Separator } from '@colanode/ui/components/ui/separator';
import { Breadcrumb } from '@colanode/ui/components/workspaces/breadcrumbs/breadcrumb';
import { BreadcrumbItem } from '@colanode/ui/components/workspaces/breadcrumbs/breadcrumb-item';
import { WorkspaceDelete } from '@colanode/ui/components/workspaces/workspace-delete';
import { WorkspaceForm } from '@colanode/ui/components/workspaces/workspace-form';
import { WorkspaceNotFound } from '@colanode/ui/components/workspaces/workspace-not-found';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { database } from '@colanode/ui/data';
import { useMutation } from '@colanode/ui/hooks/use-mutation';

export const WorkspaceSettingsScreen = () => {
  const workspace = useWorkspace();
  const { mutate, isPending } = useMutation();

  const currentWorkspaceQuery = useLiveQuery((q) =>
    q
      .from({ workspaces: database.accountWorkspaces(workspace.accountId) })
      .where(({ workspaces }) => eq(workspaces.id, workspace.id))
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
    <>
      <Breadcrumb>
        <BreadcrumbItem
          icon={(className) => <Settings className={className} />}
          name="Settings"
        />
      </Breadcrumb>
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
                  id: workspace.id,
                  accountId: workspace.accountId,
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
    </>
  );
};
