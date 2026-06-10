import { Plus } from 'lucide-react';
import { useState } from 'react';

import { MetaTypePageCreateDialog } from '@colanode/ui/components/pages/meta-type-page-create-dialog';
import { useDatabase } from '@colanode/ui/contexts/database';

interface MetaTypePageCreateButtonProps {
  label?: string;
  className?: string;
}

export const MetaTypePageCreateButton = ({
  label = 'Add page',
  className,
}: MetaTypePageCreateButtonProps) => {
  const database = useDatabase();
  const [open, setOpen] = useState(false);

  if (!database.canCreatePage) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={() => setOpen(true)}
      >
        <Plus className="size-4" />
        <span className="text-sm">{label}</span>
      </button>
      <MetaTypePageCreateDialog
        metaTypeId={database.id}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
};
