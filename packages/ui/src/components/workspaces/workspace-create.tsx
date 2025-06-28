import { toast } from 'sonner';

import { WorkspaceForm } from '@colanode/ui/components/workspaces/workspace-form';
import { useAccount } from '@colanode/ui/contexts/account';
import { useMutation } from '@colanode/ui/hooks/use-mutation';

interface WorkspaceCreateProps {
  onSuccess: (id: string) => void;
  onCancel: (() => void) | undefined;
}

export const WorkspaceCreate = ({
  onSuccess,
  onCancel,
}: WorkspaceCreateProps) => {
  const account = useAccount();
  const { mutate, isPending } = useMutation();

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
                  onSuccess(output.id);
                },
                onError(error) {
                  toast.error(error.message);
                },
              });
            }}
            isSaving={isPending}
            onCancel={onCancel}
            saveText="Create"
          />
        </div>
      </div>
    </div>
  );
};
