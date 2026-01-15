import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { useNavigate } from '@tanstack/react-router';

import { NodeContainer } from '@colanode/ui/components/nodes/node-container';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@colanode/ui/components/ui/dialog';

interface NodeModalProps {
  nodeId: string;
}
export const NodeModal = ({ nodeId }: NodeModalProps) => {
  const navigate = useNavigate();

  return (
    <Dialog
      open={true}
      onOpenChange={(open) => {
        if (!open) {
          navigate({
            from: '/workspace/$userId/$nodeId/modal/$modalNodeId',
            to: '/workspace/$userId/$nodeId',
          });
        }
      }}
      modal={true}
    >
      <DialogContent
        className="w-[90vw] h-[90vh] max-w-[90vw] max-h-[90vh] min-w-[90vw] min-h-[90vh] p-2 overflow-hidden"
        showCloseButton={false}
      >
        <VisuallyHidden>
          <DialogTitle>Modal</DialogTitle>
          <DialogDescription>
            This is a modal window. It is used to display a node in a modal
            window.
          </DialogDescription>
        </VisuallyHidden>
        <div className="h-full w-full overflow-hidden">
          <NodeContainer
            type="modal"
            nodeId={nodeId}
            onFullscreen={() => {
              navigate({
                from: '/workspace/$userId/$nodeId/modal/$modalNodeId',
                to: '/workspace/$userId/$nodeId',
                params: {
                  nodeId: nodeId,
                },
              });
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
