import { Plus } from 'lucide-react';

import { ViewSortAddPopover } from '@colanode/ui/components/databases/search/view-sort-add-popover';
import { ViewSortRow } from '@colanode/ui/components/databases/search/view-sort-row';
import { Button } from '@colanode/ui/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@colanode/ui/components/ui/popover';
import { useDatabase } from '@colanode/ui/contexts/database';
import { useDatabaseView } from '@colanode/ui/contexts/database-view';

export const ViewSorts = () => {
  const database = useDatabase();
  const view = useDatabaseView();

  return (
    <Popover
      open={view.isSortsOpened}
      onOpenChange={(open) => {
        if (open) {
          view.openSorts();
        } else {
          view.closeSorts();
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-dashed text-xs text-muted-foreground"
        >
          Sorts ({view.sorts.length})
        </Button>
      </PopoverTrigger>
      <PopoverContent className="flex flex-col gap-2 p-2">
        {view.sorts.map((sort) => {
          const field = database.fields.find(
            (field) => field.id === sort.fieldId
          );

          if (!field) return null;
          return <ViewSortRow key={sort.id} sort={sort} field={field} />;
        })}
        <ViewSortAddPopover>
          <button className="flex cursor-pointer flex-row items-center gap-1 rounded-lg p-1 text-sm text-muted-foreground hover:bg-gray-50">
            <Plus className="size-4" />
            Add sort
          </button>
        </ViewSortAddPopover>
      </PopoverContent>
    </Popover>
  );
};
