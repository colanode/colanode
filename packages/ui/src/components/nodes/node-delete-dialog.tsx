import { useRouter } from '@tanstack/react-router';

import { collections } from '@colanode/ui/collections';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@colanode/ui/components/ui/alert-dialog';
import { Button } from '@colanode/ui/components/ui/button';
import { useWorkspace } from '@colanode/ui/contexts/workspace';

interface NodeDeleteDialogProps {
  id: string;
  title: string;
  description: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NodeDeleteDialog = ({
  id,
  title,
  description,
  open,
  onOpenChange,
}: NodeDeleteDialogProps) => {
  const workspace = useWorkspace();
  const router = useRouter();

  // if the current node is opened in a modal we just navigate to the node route
  // if the current node is opened in a full screen view we just navigate to the home route
  const handleDelete = () => {
    collections.workspace(workspace.userId).nodes.delete(id);
    const matches = router.state.matches.toReversed();

    for (const match of matches) {
      if (
        match.routeId === '/workspace/$userId/$nodeId/modal/$modalNodeId' &&
        match.params.modalNodeId === id
      ) {
        router.navigate({
          to: '/workspace/$userId/$nodeId',
          params: {
            userId: workspace.userId,
            nodeId: match.params.nodeId,
          },
        });
      }

      if (
        match.routeId === '/workspace/$userId/$nodeId' &&
        match.params.nodeId === id
      ) {
        router.navigate({
          to: '/workspace/$userId/home',
          params: {
            userId: workspace.userId,
          },
        });
      }
    }

    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button variant="destructive" onClick={handleDelete}>
            Delete
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
