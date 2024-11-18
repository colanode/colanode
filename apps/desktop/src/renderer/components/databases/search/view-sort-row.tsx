import { FieldAttributes, ViewSortAttributes } from '@colanode/core';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/renderer/components/ui/dropdown-menu';
import { Button } from '@/renderer/components/ui/button';
import { useView } from '@/renderer/contexts/view';
import { FieldIcon } from '@/renderer/components/databases/fields/field-icon';
import { ChevronDown, Trash2 } from 'lucide-react';

interface ViewSortProps {
  sort: ViewSortAttributes;
  field: FieldAttributes;
}

export const ViewSortRow = ({ sort, field }: ViewSortProps) => {
  const view = useView();

  return (
    <div className="flex flex-row items-center gap-3 text-sm">
      <div className="flex flex-row items-center gap-0.5 p-1">
        <FieldIcon type={field.type} className="size-4" />
        <p>{field.name}</p>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="flex flex-grow flex-row items-center gap-1 rounded-md p-1 font-semibold hover:cursor-pointer hover:bg-gray-100">
            <p>{sort.direction === 'asc' ? 'Ascending' : 'Descending'}</p>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem
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
