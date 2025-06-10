import { ChevronDown, Trash2 } from 'lucide-react';

import {
  PhoneFieldAttributes,
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
import { SmartTextInput } from '@colanode/ui/components/ui/smart-text-input';
import { useDatabaseView } from '@colanode/ui/contexts/database-view';
import { phoneFieldFilterOperators } from '@colanode/ui/lib/databases';

interface ViewPhoneFieldFilterProps {
  field: PhoneFieldAttributes;
  filter: DatabaseViewFieldFilterAttributes;
}

export const ViewPhoneFieldFilter = ({
  field,
  filter,
}: ViewPhoneFieldFilterProps) => {
  const view = useDatabaseView();

  const operator =
    phoneFieldFilterOperators.find(
      (operator) => operator.value === filter.operator
    ) ?? phoneFieldFilterOperators[0];

  if (!operator) {
    return null;
  }

  const phoneValue = filter.value as string | null;

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
              <div className="flex flex-grow flex-row items-center gap-1 rounded-md p-1 font-semibold cursor-pointer hover:bg-gray-100">
                <p>{operator.label}</p>
                <ChevronDown className="size-4 text-muted-foreground" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {phoneFieldFilterOperators.map((operator) => (
                <DropdownMenuItem
                  key={operator.value}
                  onSelect={() => {
                    const value =
                      operator.value === 'is_empty' ||
                      operator.value === 'is_not_empty'
                        ? null
                        : phoneValue;

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
          <SmartTextInput
            value={phoneValue}
            onChange={(value) => {
              view.updateFilter(filter.id, {
                ...filter,
                value: value,
              });
            }}
          />
        )}
      </PopoverContent>
    </Popover>
  );
};
