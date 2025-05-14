import { Plus } from 'lucide-react';
import React from 'react';
import { SpaceCreateDialog } from '@colanode/ui/components/spaces/space-create-dialog';

export const SpaceCreateButton = () => {
  const [open, setOpen] = React.useState(false);
  return (
    <React.Fragment>
      <Plus className="size-4 cursor-pointer" onClick={() => setOpen(true)} />
      <SpaceCreateDialog open={open} onOpenChange={setOpen} />
    </React.Fragment>
  );
};
