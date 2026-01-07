import { useState } from 'react';

import {
  MultiSelectFieldAttributes,
  StringArrayFieldValue,
} from '@colanode/core';
import { SelectFieldOptions } from '@colanode/ui/components/databases/fields/select-field-options';
import { SelectOptionBadge } from '@colanode/ui/components/databases/fields/select-option-badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@colanode/ui/components/ui/popover';
import { useRecord } from '@colanode/ui/contexts/record';
import { useRecordField } from '@colanode/ui/hooks/use-record-field';

interface RecordMultiSelectValueProps {
  field: MultiSelectFieldAttributes;
  readOnly?: boolean;
}

export const RecordMultiSelectValue = ({
  field,
  readOnly,
}: RecordMultiSelectValueProps) => {
  const record = useRecord();

  const [open, setOpen] = useState(false);
  const { value, setValue, clearValue } = useRecordField<StringArrayFieldValue>(
    {
      field,
    }
  );

  const selectOptions = Object.values(field.options ?? {});
  const selectedOptionIds = value?.value ?? [];
  const selectedOptions = selectOptions.filter((option) =>
    selectedOptionIds.includes(option.id)
  );

  if (!record.canEdit || readOnly) {
    return (
      <div className="flex h-full w-full cursor-pointer flex-wrap gap-1 p-0">
        {selectedOptions?.map((option) => (
          <SelectOptionBadge
            key={option.id}
            name={option.name}
            color={option.color}
          />
        ))}
        {selectedOptions?.length === 0 && ' '}
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="flex h-full w-full cursor-pointer flex-wrap gap-1 p-0">
          {selectedOptions?.map((option) => (
            <SelectOptionBadge
              key={option.id}
              name={option.name}
              color={option.color}
            />
          ))}
          {selectedOptions?.length === 0 && ' '}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-1">
        <SelectFieldOptions
          field={field}
          values={selectedOptionIds}
          onSelect={(id) => {
            if (!record.canEdit || readOnly) return;

            const newValues = selectedOptionIds.includes(id)
              ? selectedOptionIds.filter((v) => v !== id)
              : [...selectedOptionIds, id];

            if (newValues.length === 0) {
              clearValue();
            } else {
              setValue({
                type: 'string_array',
                value: newValues,
              });
            }
          }}
          allowAdd={true}
        />
      </PopoverContent>
    </Popover>
  );
};
