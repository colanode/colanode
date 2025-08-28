import { toast } from 'sonner';

import { SpaceForm } from '@colanode/ui/components/spaces/space-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@colanode/ui/components/ui/dialog';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useMutation } from '@colanode/ui/hooks/use-mutation';

interface SpaceCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SpaceCreateDialog = ({
  open,
  onOpenChange,
}: SpaceCreateDialogProps) => {
  const workspace = useWorkspace();
  const { mutate, isPending } = useMutation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-xl max-w-xl min-w-xl">
        <DialogHeader>
          <DialogTitle>Create space</DialogTitle>
          <DialogDescription>
            Create a new space to collaborate with your peers
          </DialogDescription>
        </DialogHeader>
        <SpaceForm
          onSubmit={(values) => {
            if (isPending) {
              return;
            }

            if (values.name.length < 3) {
              return;
            }

            mutate({
              input: {
                type: 'space.create',
                name: values.name,
                description: values.description,
                avatar: values.avatar,
                accountId: workspace.accountId,
                workspaceId: workspace.id,
              },
              onSuccess() {
                onOpenChange(false);
              },
              onError(error) {
                toast.error(error.message);
              },
            });
          }}
          isSaving={isPending}
          onCancel={() => {
            onOpenChange(false);
          }}
          saveText="Create"
        />
      </DialogContent>
    </Dialog>
  );
};
