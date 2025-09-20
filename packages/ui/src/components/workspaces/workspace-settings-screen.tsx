import { Settings } from 'lucide-react';
import { toast } from 'sonner';

import { Breadcrumb } from '@colanode/ui/components/layouts/breadcrumbs/breadcrumb';
import { BreadcrumbItem } from '@colanode/ui/components/layouts/breadcrumbs/breadcrumb-item';
import { Separator } from '@colanode/ui/components/ui/separator';
import { WorkspaceDelete } from '@colanode/ui/components/workspaces/workspace-delete';
import { WorkspaceForm } from '@colanode/ui/components/workspaces/workspace-form';
import { WorkspaceNotFound } from '@colanode/ui/components/workspaces/workspace-not-found';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useMutation } from '@colanode/ui/hooks/use-mutation';
import { useAppStore } from '@colanode/ui/stores/app';

export const WorkspaceSettingsScreen = () => {
  const workspace = useWorkspace();
  const { mutate, isPending } = useMutation();

  const currentWorkspace = useAppStore(
    (state) => state.accounts[workspace.accountId]?.workspaces[workspace.id]
  );
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
