import { useLiveQuery } from '@tanstack/react-db';
import { useRouter } from '@tanstack/react-router';
import { toast } from 'sonner';

import { collections } from '@colanode/ui/collections';
import { WorkspaceForm } from '@colanode/ui/components/workspaces/workspace-form';
import { useMutation } from '@colanode/ui/hooks/use-mutation';

interface WorkspaceCreateProps {
  accountId: string;
}

export const WorkspaceCreate = ({ accountId }: WorkspaceCreateProps) => {
  const router = useRouter();
  const { mutate, isPending } = useMutation();

  const workspacesQuery = useLiveQuery(
    (q) =>
      q
        .from({ workspaces: collections.workspaces })
        .select(({ workspaces }) => ({
          userId: workspaces.userId,
        })),
    []
  );

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
                  accountId: accountId,
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
