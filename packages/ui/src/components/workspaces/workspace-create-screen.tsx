import { useRouter } from '@tanstack/react-router';
import { toast } from 'sonner';

import { WorkspaceForm } from '@colanode/ui/components/workspaces/workspace-form';
import { useAccount } from '@colanode/ui/contexts/account';
import { useLiveQuery } from '@colanode/ui/hooks/use-live-query';
import { useMutation } from '@colanode/ui/hooks/use-mutation';

export const WorkspaceCreateScreen = () => {
  const account = useAccount();
  const router = useRouter();
  const { mutate, isPending } = useMutation();

  const workspacesQuery = useLiveQuery({
    type: 'workspace.list',
    accountId: account.id,
  });

  const workspaces = workspacesQuery.data ?? [];
  const handleCancel = router.history.canGoBack()
    ? () => router.history.back()
    : workspaces.length > 0
      ? () =>
          router.navigate({
            to: '/acc/$accountId/$workspaceId',
            params: { accountId: account.id, workspaceId: workspaces[0]!.id },
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
                  accountId: account.id,
                  avatar: values.avatar ?? null,
                },
                onSuccess(output) {
                  router.navigate({
                    to: '/acc/$accountId/$workspaceId',
                    params: { accountId: account.id, workspaceId: output.id },
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
