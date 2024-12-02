import { Button } from '@/renderer/components/ui/button';
import { Spinner } from '@/renderer/components/ui/spinner';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useMutation } from '@/renderer/hooks/use-mutation';
import { toast } from '@/renderer/hooks/use-toast';

interface SpaceDeleteFormProps {
  id: string;
  onDeleted: () => void;
}

export const SpaceDeleteForm = ({ id }: SpaceDeleteFormProps) => {
  const workspace = useWorkspace();
  const { mutate, isPending } = useMutation();

  return (
    <div className="flex flex-col space-y-4">
      <h3 className="font-heading mb-px mt-2 text-xl font-semibold tracking-tight">
        Delete space
      </h3>
      <p>Deleting a space is permanent and cannot be undone.</p>
      <p>
        All data associated with the space will be deleted, including messages,
        pages, channels, databases, records, files and more.
      </p>
      <div>
        <Button
          variant="destructive"
          onClick={() => {
            mutate({
              input: {
                type: 'space_delete',
                userId: workspace.userId,
                spaceId: id,
              },
              onSuccess() {
                toast({
                  title: 'Space deleted',
                  description: 'Space was deleted successfully',
                  variant: 'default',
                });
              },
              onError(error) {
                toast({
                  title: 'Failed to delete space',
                  description: error.message,
                  variant: 'destructive',
                });
              },
            });
          }}
        >
          {isPending && <Spinner className="mr-1" />}Delete space
        </Button>
      </div>
    </div>
  );
};
