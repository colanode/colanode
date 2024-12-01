import { ViewFilterAttributes } from '@colanode/core';
import { Plus } from 'lucide-react';

import { useDatabase } from '@/renderer/contexts/database';
import { useView } from '@/renderer/contexts/view';

interface BoardViewRecordCreateCardProps {
  filters: ViewFilterAttributes[];
}

export const BoardViewRecordCreateCard = ({
  filters,
}: BoardViewRecordCreateCardProps) => {
  const database = useDatabase();
  const view = useView();

  if (!database.canCreateRecord) {
    return null;
  }

  return (
    <button
      type="button"
      className="animate-fade-in flex h-8 w-full cursor-pointer flex-row items-center gap-1 text-muted-foreground hover:bg-gray-50 mt-2"
      onClick={() => view.createRecord(filters)}
    >
      <Plus className="size-4" />
      <span className="text-sm">Add record</span>
    </button>
  );
};
