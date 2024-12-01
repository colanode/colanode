import { useWorkspace } from '@/renderer/contexts/workspace';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/renderer/components/ui/dialog';
import { useMutation } from '@/renderer/hooks/use-mutation';
import { IdType, generateId } from '@colanode/core';
import { DatabaseForm } from '@/renderer/components/databases/database-form';

interface DatabaseCreateDialogProps {
  spaceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DatabaseCreateDialog = ({
  spaceId,
  open,
  onOpenChange,
}: DatabaseCreateDialogProps) => {
  const workspace = useWorkspace();
  const { mutate, isPending } = useMutation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create database</DialogTitle>
          <DialogDescription>
            Create a new database to store your data
          </DialogDescription>
        </DialogHeader>
        <DatabaseForm
          id={generateId(IdType.Database)}
          values={{
            name: '',
            avatar: null,
          }}
          isPending={isPending}
          submitText="Create"
          handleCancel={() => {
            onOpenChange(false);
          }}
          handleSubmit={(values) => {
            console.log('submit', values);
            if (isPending) {
              return;
            }

            mutate({
              input: {
                type: 'database_create',
                spaceId: spaceId,
                name: values.name,
                avatar: values.avatar,
                userId: workspace.userId,
              },
              onSuccess(output) {
                onOpenChange(false);
                workspace.openInMain(output.id);
              },
            });
          }}
        />
      </DialogContent>
    </Dialog>
  );
};
