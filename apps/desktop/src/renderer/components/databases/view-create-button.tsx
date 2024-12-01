import { Plus } from 'lucide-react';
import React from 'react';

import { ViewCreateDialog } from '@/renderer/components/databases/view-create-dialog';

export const ViewCreateButton = () => {
  const [open, setOpen] = React.useState(false);

  return (
    <React.Fragment>
      <Plus
        className="mb-1 size-4 cursor-pointer text-sm text-muted-foreground hover:text-foreground"
        onClick={() => setOpen(true)}
      />
      <ViewCreateDialog open={open} onOpenChange={setOpen} />
    </React.Fragment>
  );
};
