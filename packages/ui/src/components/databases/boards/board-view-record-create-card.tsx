import { Plus } from 'lucide-react';

import { DatabaseViewFilterAttributes } from '@colanode/core';
import { useDatabase } from '@colanode/ui/contexts/database';
import { useDatabaseView } from '@colanode/ui/contexts/database-view';

interface BoardViewRecordCreateCardProps {
  filters: DatabaseViewFilterAttributes[];
}

export const BoardViewRecordCreateCard = ({
  filters,
}: BoardViewRecordCreateCardProps) => {
  const database = useDatabase();
  const view = useDatabaseView();

  if (!database.canCreateRecord) {
    return null;
  }

  return (
    <button
      type="button"
      className="animate-fade-in flex h-8 w-full cursor-pointer flex-row items-center gap-1 text-muted-foreground hover:bg-accent mt-2 rounded-md"
      onClick={() => view.createRecord(filters)}
    >
      <Plus className="size-4" />
      <span className="text-sm">Add record</span>
    </button>
  );
};
