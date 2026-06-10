import { Plus } from 'lucide-react';

import { MetaTypePageCreateButton } from '@colanode/ui/components/pages/meta-type-page-create-button';
import { useDatabase } from '@colanode/ui/contexts/database';
import { useDatabaseView } from '@colanode/ui/contexts/database-view';

export const TableViewRecordCreateRow = () => {
  const database = useDatabase();
  const view = useDatabaseView();

  return (
    <>
      {database.canCreateRecord && (
        <button
          type="button"
          className="animate-fade-in flex h-8 w-full cursor-pointer flex-row items-center gap-1 border-b pl-2 text-muted-foreground hover:bg-accent"
          onClick={() => view.createRecord()}
        >
          <Plus className="size-4" />
          <span className="text-sm">Add record</span>
        </button>
      )}
      <MetaTypePageCreateButton
        label="Add page"
        className="animate-fade-in flex h-8 w-full cursor-pointer flex-row items-center gap-1 border-b pl-2 text-muted-foreground hover:bg-accent"
      />
    </>
  );
};
