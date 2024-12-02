import { WorkspaceForm } from '@/renderer/components/workspaces/workspace-form';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useMutation } from '@/renderer/hooks/use-mutation';
import { toast } from '@/renderer/hooks/use-toast';

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
            type: 'workspace_update',
            id: workspace.id,
            accountId: workspace.accountId,
            name: values.name,
            description: values.description,
            avatar: values.avatar ?? null,
          },
          onSuccess() {
            toast({
              title: 'Workspace updated',
              description: 'Workspace was updated successfully',
              variant: 'default',
            });
          },
          onError(error) {
            toast({
              title: 'Failed to update workspace',
              description: error.message,
              variant: 'destructive',
            });
          },
        });
      }}
      isSaving={isPending}
      saveText="Update"
    />
  );
};
