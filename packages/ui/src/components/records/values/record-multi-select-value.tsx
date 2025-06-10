import { useEffect, useState } from 'react';

import { MultiSelectFieldAttributes } from '@colanode/core';
import { SelectFieldOptions } from '@colanode/ui/components/databases/fields/select-field-options';
import { SelectOptionBadge } from '@colanode/ui/components/databases/fields/select-option-badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@colanode/ui/components/ui/popover';
import { useRecord } from '@colanode/ui/contexts/record';

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
  const [selectedValues, setSelectedValues] = useState(
    record.getMultiSelectValue(field)
  );

  useEffect(() => {
    setSelectedValues(record.getMultiSelectValue(field));
  }, [record.localRevision]);

  const selectOptions = Object.values(field.options ?? {});
  const selectedOptions = selectOptions.filter((option) =>
    selectedValues.includes(option.id)
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
          values={selectedValues}
          onSelect={(id) => {
            if (!record.canEdit || readOnly) return;

            const newValues = selectedValues.includes(id)
              ? selectedValues.filter((v) => v !== id)
              : [...selectedValues, id];

            setSelectedValues(newValues);

            if (newValues.length === 0) {
              record.removeFieldValue(field);
            } else {
              record.updateFieldValue(field, {
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
