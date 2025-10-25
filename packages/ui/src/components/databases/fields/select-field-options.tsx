import { useMutation } from '@tanstack/react-query';
import { Check, Plus, X } from 'lucide-react';
import { Fragment, useState } from 'react';
import { toast } from 'sonner';

import { MutationError, MutationErrorCode } from '@colanode/client/mutations';
import {
  compareString,
  generateFractionalIndex,
  generateId,
  IdType,
  MultiSelectFieldAttributes,
  SelectFieldAttributes,
} from '@colanode/core';
import { collections } from '@colanode/ui/collections';
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

  const selectOptions = Object.values(field.options ?? {});

  const [inputValue, setInputValue] = useState('');
  const [color, setColor] = useState(getRandomSelectOptionColor());
  const showNewOption =
    database.canEdit &&
    allowAdd &&
    !selectOptions.some((option) => option.name === inputValue.trim());

  const { mutate, isPending } = useMutation({
    mutationFn: async ({ name, color }: { name: string; color: string }) => {
      const nodes = collections.workspace(workspace.userId).nodes;
      if (!nodes.has(database.id)) {
        return null;
      }

      const selectOptionId = generateId(IdType.SelectOption);
      nodes.update(database.id, (draft) => {
        if (draft.attributes.type !== 'database') {
          return;
        }

        const fieldDraft = draft.attributes.fields[field.id];
        if (!fieldDraft) {
          throw new MutationError(
            MutationErrorCode.FieldNotFound,
            'The field you are trying to create a select option in does not exist.'
          );
        }

        if (
          fieldDraft.type !== 'multi_select' &&
          fieldDraft.type !== 'select'
        ) {
          throw new MutationError(
            MutationErrorCode.FieldTypeInvalid,
            'The field you are trying to create a select option in is not a "Select" or "Multi-Select" field.'
          );
        }

        const existingOptions = fieldDraft.options ?? {};
        const maxIndex = Object.values(existingOptions)
          .map((selectOption) => selectOption.index)
          .sort((a, b) => -compareString(a, b))[0];

        const index = generateFractionalIndex(maxIndex, null);

        const updatedOptions = {
          ...existingOptions,
          [selectOptionId]: {
            name: name,
            id: selectOptionId,
            color: color,
            index: index,
          },
        };

        fieldDraft.options = updatedOptions;
      });

      return selectOptionId;
    },
    onSuccess: (selectOptionId) => {
      if (!selectOptionId) {
        return;
      }

      setInputValue('');
      setColor(getRandomSelectOptionColor());
      onSelect(selectOptionId);
    },
    onError: (error) => {
      console.log('error', error);
      toast.error(error.message as string);
    },
  });

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
                mutate({ name: inputValue.trim(), color });
              }}
              disabled={isPending}
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
