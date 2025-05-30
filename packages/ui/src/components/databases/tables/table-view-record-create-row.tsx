import { Plus } from 'lucide-react';

import { useDatabase } from '@colanode/ui/contexts/database';
import { useDatabaseView } from '@colanode/ui/contexts/database-view';

export const TableViewRecordCreateRow = () => {
  const database = useDatabase();
  const view = useDatabaseView();

  if (!database.canCreateRecord) {
    return null;
  }

  return (
    <button
      type="button"
      className="animate-fade-in flex h-8 w-full cursor-pointer flex-row items-center gap-1 border-b pl-2 text-muted-foreground hover:bg-gray-50"
      onClick={() => view.createRecord()}
    >
      <Plus className="size-4" />
      <span className="text-sm">Add record</span>
    </button>
  );
};
