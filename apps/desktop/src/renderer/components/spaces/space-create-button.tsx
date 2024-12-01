import { Plus } from 'lucide-react';
import React from 'react';

import { SpaceCreateDialog } from '@/renderer/components/spaces/space-create-dialog';

export const SpaceCreateButton = () => {
  const [open, setOpen] = React.useState(false);
  return (
    <React.Fragment>
      <Plus
        className="mr-2 size-4 cursor-pointer"
        onClick={() => setOpen(true)}
      />
      <SpaceCreateDialog open={open} onOpenChange={setOpen} />
    </React.Fragment>
  );
};
