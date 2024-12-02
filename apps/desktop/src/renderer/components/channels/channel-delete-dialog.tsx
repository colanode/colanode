import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/renderer/components/ui/alert-dialog';
import { Button } from '@/renderer/components/ui/button';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useMutation } from '@/renderer/hooks/use-mutation';
import { toast } from '@/renderer/hooks/use-toast';

interface ChannelDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nodeId: string;
}

export const ChannelDeleteDialog = ({
  nodeId,
  open,
  onOpenChange,
}: ChannelDeleteDialogProps) => {
  const workspace = useWorkspace();
  const { mutate, isPending } = useMutation();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Are you sure you want delete this channel?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This channel will no longer be
            accessible by you or others you&apos;ve shared it with.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={isPending}
            onClick={() => {
              mutate({
                input: {
                  type: 'channel_delete',
                  channelId: nodeId,
                  userId: workspace.userId,
                },
                onSuccess() {
                  onOpenChange(false);
                  workspace.closeNode(nodeId);
                },
                onError(error) {
                  toast({
                    title: 'Failed to delete channel',
                    description: error.message,
                    variant: 'destructive',
                  });
                },
              });
            }}
          >
            Delete
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
