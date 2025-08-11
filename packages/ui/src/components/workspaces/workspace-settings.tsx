import { toast } from 'sonner';

import { Container, ContainerBody } from '@colanode/ui/components/ui/container';
import { Separator } from '@colanode/ui/components/ui/separator';
import { WorkspaceDelete } from '@colanode/ui/components/workspaces/workspace-delete';
import { WorkspaceForm } from '@colanode/ui/components/workspaces/workspace-form';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useMutation } from '@colanode/ui/hooks/use-mutation';

export const WorkspaceSettings = () => {
  const workspace = useWorkspace();
  const { mutate, isPending } = useMutation();
  const canEdit = workspace.role === 'owner';

  return (
    <Container>
      <ContainerBody className="max-w-4xl space-y-8">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">General</h2>
            <Separator className="mt-3" />
          </div>
          <WorkspaceForm
            readOnly={!canEdit}
            values={{
              name: workspace.name,
              description: workspace.description ?? '',
              avatar: workspace.avatar ?? null,
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
      </ContainerBody>
    </Container>
  );
};
