import { ChevronDown, Trash2 } from 'lucide-react';

import {
  BooleanFieldAttributes,
  DatabaseViewFieldFilterAttributes,
} from '@colanode/core';
import { FieldIcon } from '@colanode/ui/components/databases/fields/field-icon';
import { Button } from '@colanode/ui/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@colanode/ui/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@colanode/ui/components/ui/popover';
import { useDatabaseView } from '@colanode/ui/contexts/database-view';
import { booleanFieldFilterOperators } from '@colanode/ui/lib/databases';

interface ViewBooleanFieldFilterProps {
  field: BooleanFieldAttributes;
  filter: DatabaseViewFieldFilterAttributes;
}

export const ViewBooleanFieldFilter = ({
  field,
  filter,
}: ViewBooleanFieldFilterProps) => {
  const view = useDatabaseView();

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
              <div className="flex flex-grow flex-row items-center gap-1 rounded-md p-1 font-semibold cursor-pointer hover:bg-accent">
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
