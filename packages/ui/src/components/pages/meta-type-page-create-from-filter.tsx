import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';

import { DatabaseViewFilterAttributes } from '@colanode/core';
import { MetaTypePageCreateDialog } from '@colanode/ui/components/pages/meta-type-page-create-dialog';
import { useDatabase } from '@colanode/ui/contexts/database';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { generateFieldValuesFromFilters } from '@colanode/ui/lib/databases';
import { resolveInitialPageFields } from '@colanode/ui/lib/page-field-values';

interface MetaTypePageCreateFromFilterProps {
  filters: DatabaseViewFilterAttributes[];
  label?: string;
  className?: string;
}

export const MetaTypePageCreateFromFilter = ({
  filters,
  label = 'Add page',
  className,
}: MetaTypePageCreateFromFilterProps) => {
  const workspace = useWorkspace();
  const database = useDatabase();
  const [open, setOpen] = useState(false);

  const initialFields = useMemo(
    () =>
      resolveInitialPageFields(database, {
        filterValues: generateFieldValuesFromFilters(
          database.fields,
          filters,
          workspace.userId
        ),
      }),
    [database, database.fields, filters, workspace.userId]
  );

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
        initialFields={initialFields}
      />
    </>
  );
};
