import { Plus } from 'lucide-react';
import { Fragment, useState } from 'react';

import { ViewCreateDialog } from '@colanode/ui/components/databases/view-create-dialog';

export const ViewCreateButton = () => {
  const [open, setOpen] = useState(false);

  return (
    <Fragment>
      <Plus
        className="mb-1 size-4 cursor-pointer text-sm text-muted-foreground hover:text-foreground"
        onClick={() => setOpen(true)}
      />
      <ViewCreateDialog open={open} onOpenChange={setOpen} />
    </Fragment>
  );
};
