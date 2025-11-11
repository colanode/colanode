import { useRouter } from '@tanstack/react-router';
import { toast } from 'sonner';

import { WorkspaceForm } from '@colanode/ui/components/workspaces/workspace-form';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useLiveQuery } from '@colanode/ui/hooks/use-live-query';
import { useMutation } from '@colanode/ui/hooks/use-mutation';

export const WorkspaceCreateScreen = () => {
  const workspace = useWorkspace();
  const router = useRouter();
  const { mutate, isPending } = useMutation();

  const workspacesQuery = useLiveQuery({
    type: 'workspace.list',
    accountId: workspace.accountId,
  });

  const workspaces = workspacesQuery.data ?? [];
  const handleCancel = router.history.canGoBack()
    ? () => router.history.back()
    : workspaces.length > 0
      ? () =>
          router.navigate({
            to: '/workspace/$userId',
            params: { userId: workspaces[0]!.userId },
          })
      : undefined;

  return (
    <div className="flex flex-row justify-center w-full">
      <div className="container flex flex-row justify-center">
        <div className="w-full max-w-[700px]">
          <div className="flex flex-row justify-center py-8">
            <h1 className="text-center text-4xl font-bold leading-tight tracking-tighter lg:leading-[1.1]">
              Setup your workspace
            </h1>
          </div>
          <WorkspaceForm
            onSubmit={(values) => {
              mutate({
                input: {
                  type: 'workspace.create',
                  name: values.name,
                  description: values.description,
                  accountId: workspace.accountId,
                  avatar: values.avatar ?? null,
                },
                onSuccess(output) {
                  router.navigate({
                    to: '/workspace/$userId',
                    params: { userId: output.userId },
                  });
                },
                onError(error) {
                  toast.error(error.message);
                },
              });
            }}
            isSaving={isPending}
            onCancel={handleCancel}
            saveText="Create"
          />
        </div>
      </div>
    </div>
  );
};
