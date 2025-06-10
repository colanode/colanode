import { Plus } from 'lucide-react';
import { Fragment, useState } from 'react';

import { SpaceCreateDialog } from '@colanode/ui/components/spaces/space-create-dialog';

export const SpaceCreateButton = () => {
  const [open, setOpen] = useState(false);

  return (
    <Fragment>
      <Plus className="size-4 cursor-pointer" onClick={() => setOpen(true)} />
      <SpaceCreateDialog open={open} onOpenChange={setOpen} />
    </Fragment>
  );
};
