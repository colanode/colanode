import { ChevronDown, Trash2 } from 'lucide-react';

import { FieldAttributes, DatabaseViewSortAttributes } from '@colanode/core';
import { FieldIcon } from '@colanode/ui/components/databases/fields/field-icon';
import { Button } from '@colanode/ui/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@colanode/ui/components/ui/dropdown-menu';
import { useDatabaseView } from '@colanode/ui/contexts/database-view';

interface ViewSortFieldRowProps {
  sort: DatabaseViewSortAttributes;
  field: FieldAttributes;
}

export const ViewSortFieldRow = ({ sort, field }: ViewSortFieldRowProps) => {
  const view = useDatabaseView();

  return (
    <div className="flex flex-row items-center gap-3 text-sm">
      <div className="flex flex-row items-center gap-0.5 p-1">
        <FieldIcon type={field.type} className="size-4" />
        <p>{field.name}</p>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="flex flex-grow flex-row items-center gap-1 rounded-md p-1 font-semibold cursor-pointer hover:bg-gray-100">
            <p>{sort.direction === 'asc' ? 'Ascending' : 'Descending'}</p>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => {
              view.updateSort(sort.id, {
                ...sort,
                direction: 'asc',
              });
            }}
          >
            <p>Ascending</p>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => {
              view.updateSort(sort.id, {
                ...sort,
                direction: 'desc',
              });
            }}
          >
            <p>Descending</p>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => {
          view.removeSort(sort.id);
        }}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
};
