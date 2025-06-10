import { Check, Plus, X } from 'lucide-react';
import { Fragment, useState } from 'react';
import { toast } from 'sonner';

import {
  MultiSelectFieldAttributes,
  SelectFieldAttributes,
} from '@colanode/core';
import { SelectOptionBadge } from '@colanode/ui/components/databases/fields/select-option-badge';
import { SelectOptionSettingsPopover } from '@colanode/ui/components/databases/fields/select-option-settings-popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@colanode/ui/components/ui/command';
import { useDatabase } from '@colanode/ui/contexts/database';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useMutation } from '@colanode/ui/hooks/use-mutation';
import { getRandomSelectOptionColor } from '@colanode/ui/lib/databases';

interface SelectFieldOptionsProps {
  field: SelectFieldAttributes | MultiSelectFieldAttributes;
  values: string[];
  onSelect: (id: string) => void;
  allowAdd: boolean;
}

export const SelectFieldOptions = ({
  field,
  values,
  onSelect,
  allowAdd,
}: SelectFieldOptionsProps) => {
  const workspace = useWorkspace();
  const database = useDatabase();
  const { mutate, isPending } = useMutation();

  const selectOptions = Object.values(field.options ?? {});

  const [inputValue, setInputValue] = useState('');
  const [color, setColor] = useState(getRandomSelectOptionColor());
  const showNewOption =
    database.canEdit &&
    allowAdd &&
    !selectOptions.some((option) => option.name === inputValue.trim());

  return (
    <Command className="min-h-min">
      <CommandInput
        placeholder="Search options..."
        className="h-9"
        value={inputValue}
        onValueChange={setInputValue}
      />
      <CommandEmpty>No options found.</CommandEmpty>
      <CommandList>
        <CommandGroup className="h-min">
          {selectOptions.map((option) => {
            const isSelected = values.includes(option.id);
            return (
              <CommandItem
                key={option.id}
                value={option.name}
                onSelect={() => {
                  onSelect(option.id);
                }}
                className="group flex w-full cursor-pointer flex-row items-center gap-1"
              >
                <div className="flex-1">
                  <SelectOptionBadge name={option.name} color={option.color} />
                </div>
                <div className="flex flex-row items-center gap-2">
                  {isSelected ? (
                    <Fragment>
                      <Check className="size-4 group-hover:hidden" />
                      <X className="hidden size-4 group-hover:block" />
                    </Fragment>
                  ) : (
                    <Plus className="hidden size-4 group-hover:block" />
                  )}
                </div>
                <div
                  className="opacity-0 group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                  }}
                >
                  <SelectOptionSettingsPopover
                    option={option}
                    fieldId={field.id}
                  />
                </div>
              </CommandItem>
            );
          })}
        </CommandGroup>
        <CommandGroup>
          {showNewOption && inputValue.length > 0 && (
            <CommandItem
              key={inputValue.trim()}
              value={inputValue.trim()}
              onSelect={() => {
                if (isPending) {
                  return;
                }

                if (inputValue.trim().length === 0) {
                  return;
                }

                mutate({
                  input: {
                    type: 'select.option.create',
                    databaseId: database.id,
                    fieldId: field.id,
                    name: inputValue.trim(),
                    color,
                    accountId: workspace.accountId,
                    workspaceId: workspace.id,
                  },
                  onSuccess(output) {
                    setInputValue('');
                    setColor(getRandomSelectOptionColor());
                    onSelect(output.id);
                  },
                  onError(error) {
                    toast.error(error.message);
                  },
                });
              }}
              className="flex flex-row items-center gap-2"
            >
              <span className="text-xs text-muted-foreground">Create</span>
              <SelectOptionBadge name={inputValue} color={color} />
            </CommandItem>
          )}
        </CommandGroup>
      </CommandList>
    </Command>
  );
};
