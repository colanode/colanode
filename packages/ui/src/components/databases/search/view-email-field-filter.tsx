import { ChevronDown, Trash2 } from 'lucide-react';

import {
  EmailFieldAttributes,
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
import { emailFieldFilterOperators } from '@colanode/ui/lib/databases';

interface ViewEmailFieldFilterProps {
  field: EmailFieldAttributes;
  filter: DatabaseViewFieldFilterAttributes;
}

const isOperatorWithoutValue = (operator: string) => {
  return operator === 'is_empty' || operator === 'is_not_empty';
};

export const ViewEmailFieldFilter = ({
  field,
  filter,
}: ViewEmailFieldFilterProps) => {
  const view = useDatabaseView();

  const operator =
    emailFieldFilterOperators.find(
      (operator) => operator.value === filter.operator
    ) ?? emailFieldFilterOperators[0];

  if (!operator) {
    return null;
  }

  const textValue = filter.value as string | null;

  const hideInput = isOperatorWithoutValue(operator.value);

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
          className="text-muted-foregroundc border-dashed text-xs"
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
              {emailFieldFilterOperators.map((operator) => (
                <DropdownMenuItem
                  key={operator.value}
                  onSelect={() => {
                    const value = isOperatorWithoutValue(operator.value)
                      ? null
                      : textValue;

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
            value={textValue}
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
