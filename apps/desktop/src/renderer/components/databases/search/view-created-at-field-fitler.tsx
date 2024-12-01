import {
  CreatedAtFieldAttributes,
  ViewFieldFilterAttributes,
} from '@colanode/core';
import { ChevronDown, Trash2 } from 'lucide-react';

import { FieldIcon } from '@/renderer/components/databases/fields/field-icon';
import { Button } from '@/renderer/components/ui/button';
import { DatePicker } from '@/renderer/components/ui/date-picker';
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
import { dateFieldFilterOperators } from '@/shared/lib/databases';

interface ViewCreatedAtFieldFilterProps {
  field: CreatedAtFieldAttributes;
  filter: ViewFieldFilterAttributes;
}

export const ViewCreatedAtFieldFilter = ({
  field,
  filter,
}: ViewCreatedAtFieldFilterProps) => {
  const view = useView();

  const operator =
    dateFieldFilterOperators.find(
      (operator) => operator.value === filter.operator
    ) ?? dateFieldFilterOperators[0];

  if (!operator) {
    return null;
  }

  const dateTextValue = (filter.value as string) ?? null;
  const dateValue = dateTextValue ? new Date(dateTextValue) : null;

  return (
    <Popover
      open={view.isFieldFilterOpened(filter.id)}
      onOpenChange={() => {
        if (view.isFieldFilterOpened(filter.id)) {
          view.closeFieldFilter(filter.id);
        } else {
          view.openFieldFilter(filter.id);
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
              {dateFieldFilterOperators.map((operator) => (
                <DropdownMenuItem
                  key={operator.value}
                  onSelect={() => {
                    const value =
                      operator.value === 'is_empty' ||
                      operator.value === 'is_not_empty'
                        ? null
                        : dateValue?.toISOString();

                    view.updateFilter(filter.id, {
                      ...filter,
                      operator: operator.value,
                      value: value ?? null,
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
        <DatePicker
          value={dateValue}
          onChange={(newValue) => {
            if (newValue === null || newValue === undefined) {
              view.updateFilter(filter.id, {
                ...filter,
                value: null,
              });
            } else {
              view.updateFilter(filter.id, {
                ...filter,
                value: newValue.toISOString(),
              });
            }
          }}
          placeholder="Select date"
          className="flex h-full w-full cursor-pointer flex-row items-center gap-1 rounded-md border border-input p-2 text-sm"
        />
      </PopoverContent>
    </Popover>
  );
};
