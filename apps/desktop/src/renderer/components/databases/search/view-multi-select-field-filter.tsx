import {
  MultiSelectFieldAttributes,
  ViewFieldFilterAttributes,
} from '@colanode/core';
import { ChevronDown, Trash2 } from 'lucide-react';

import { FieldIcon } from '@/renderer/components/databases/fields/field-icon';
import { SelectFieldOptions } from '@/renderer/components/databases/fields/select-field-options';
import { SelectOptionBadge } from '@/renderer/components/databases/fields/select-option-badge';
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
import { selectFieldFilterOperators } from '@/shared/lib/databases';

interface ViewMultiSelectFieldFilterProps {
  field: MultiSelectFieldAttributes;
  filter: ViewFieldFilterAttributes;
}

export const ViewMultiSelectFieldFilter = ({
  field,
  filter,
}: ViewMultiSelectFieldFilterProps) => {
  const view = useView();
  const selectOptions = Object.values(field.options ?? {});
  const operator =
    selectFieldFilterOperators.find(
      (operator) => operator.value === filter.operator
    ) ?? selectFieldFilterOperators[0];

  if (!operator) {
    return null;
  }

  const selectOptionIds = (filter.value as string[]) ?? [];
  const selectedOptions = selectOptions.filter((option) =>
    selectOptionIds.includes(option.id)
  );

  const hideInput =
    operator.value === 'is_empty' || operator.value === 'is_not_empty';

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
              {selectFieldFilterOperators.map((operator) => (
                <DropdownMenuItem
                  key={operator.value}
                  onSelect={() => {
                    const value =
                      operator.value === 'is_empty' ||
                      operator.value === 'is_not_empty'
                        ? []
                        : selectOptionIds;

                    view.updateFilter(filter.id, {
                      ...filter,
                      operator: operator.value,
                      value: value,
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
        {!hideInput && (
          <Popover>
            <PopoverTrigger asChild>
              <div className="flex h-full w-full cursor-pointer flex-row items-center gap-1 rounded-md border border-input p-2">
                {selectedOptions.map((option) => (
                  <SelectOptionBadge
                    key={option.id}
                    name={option.name}
                    color={option.color}
                  />
                ))}
                {selectedOptions.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No options selected
                  </p>
                )}
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-1">
              <SelectFieldOptions
                field={field}
                values={selectOptionIds}
                onSelect={(id) => {
                  const values = selectOptionIds.includes(id)
                    ? selectOptionIds.filter((value) => value !== id)
                    : [...selectOptionIds, id];

                  view.updateFilter(filter.id, {
                    ...filter,
                    value: values,
                  });
                }}
                allowAdd={false}
              />
            </PopoverContent>
          </Popover>
        )}
      </PopoverContent>
    </Popover>
  );
};
