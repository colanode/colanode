import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import React from 'react';

import { NodeContainer } from '@/renderer/components/layouts/node-container';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/renderer/components/ui/dialog';
import { ContainerContext } from '@/renderer/contexts/container';
import { useWorkspace } from '@/renderer/contexts/workspace';

interface LayoutModalProps {
  nodeId: string;
}

export const LayoutModal = ({ nodeId }: LayoutModalProps) => {
  const workspace = useWorkspace();
  const [open, setOpen] = React.useState(true);

  React.useEffect(() => {
    if (!open) {
      workspace.closeModal();
    }
  }, [open]);

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        setOpen(open);
      }}
    >
      <DialogContent
        className="flex h-[calc(100vh-100px)] max-h-full w-8/12 max-w-full flex-col gap-1 overflow-hidden px-0.5 pt-0 md:w-8/12"
        aria-describedby={undefined}
      >
        <VisuallyHidden>
          <DialogTitle>Modal</DialogTitle>
        </VisuallyHidden>
        <ContainerContext.Provider value={{ nodeId, mode: 'modal' }}>
          <NodeContainer nodeId={nodeId} />
        </ContainerContext.Provider>
      </DialogContent>
    </Dialog>
  );
};
