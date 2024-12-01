import {
  BooleanFieldAttributes,
  ViewFieldFilterAttributes,
} from '@colanode/core';
import { ChevronDown, Trash2 } from 'lucide-react';

import { FieldIcon } from '@/renderer/components/databases/fields/field-icon';
import { Button } from '@/renderer/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/renderer/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/renderer/components/ui/popover';
import { useView } from '@/renderer/contexts/view';
import { booleanFieldFilterOperators } from '@/shared/lib/databases';

interface ViewBooleanFieldFilterProps {
  field: BooleanFieldAttributes;
  filter: ViewFieldFilterAttributes;
}

export const ViewBooleanFieldFilter = ({
  field,
  filter,
}: ViewBooleanFieldFilterProps) => {
  const view = useView();

  const operator =
    booleanFieldFilterOperators.find(
      (operator) => operator.value === filter.operator
    ) ?? booleanFieldFilterOperators[0];

  if (!operator) {
    return null;
  }

  return (
    <Popover
      open={view.isFieldFilterOpened(filter.id)}
      onOpenChange={(open) => {
        if (open) {
          view.openFieldFilter(filter.id);
        } else {
          view.closeFieldFilter(filter.id);
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
          {field.name}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="flex w-96 flex-col gap-2 p-2">
        <div className="flex flex-row items-center gap-3 text-sm">
          <div className="flex flex-row items-center gap-0.5 p-1">
            <FieldIcon type={field.type} className="size-4" />
            <p>{field.name}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex flex-grow flex-row items-center gap-1 rounded-md p-1 font-semibold hover:cursor-pointer hover:bg-gray-100">
                <p>{operator.label}</p>
                <ChevronDown className="size-4 text-muted-foreground" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {booleanFieldFilterOperators.map((operator) => (
                <DropdownMenuItem
                  key={operator.value}
                  onSelect={() => {
                    view.updateFilter(filter.id, {
                      ...filter,
                      operator: operator.value,
                    });
                  }}
                >
                  {operator.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              view.removeFilter(filter.id);
            }}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
