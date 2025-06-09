import { toast } from 'sonner';

import { WorkspaceForm } from '@colanode/ui/components/workspaces/workspace-form';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useMutation } from '@colanode/ui/hooks/use-mutation';

export const WorkspaceUpdate = () => {
  const workspace = useWorkspace();
  const { mutate, isPending } = useMutation();
  const canEdit = workspace.role === 'owner';

  return (
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
  );
};
