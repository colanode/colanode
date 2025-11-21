import { useState } from 'react';

import { SelectFieldAttributes, StringFieldValue } from '@colanode/core';
import { SelectFieldOptions } from '@colanode/ui/components/databases/fields/select-field-options';
import { SelectOptionBadge } from '@colanode/ui/components/databases/fields/select-option-badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@colanode/ui/components/ui/popover';
import { useRecord } from '@colanode/ui/contexts/record';
import { useRecordField } from '@colanode/ui/hooks/use-record-field';

interface RecordSelectValueProps {
  field: SelectFieldAttributes;
  readOnly?: boolean;
}

export const RecordSelectValue = ({
  field,
  readOnly,
}: RecordSelectValueProps) => {
  const record = useRecord();
  const { value, setValue, clearValue } = useRecordField<StringFieldValue>({
    field,
  });

  const [open, setOpen] = useState(false);
  const selectedOption = field.options?.[value?.value ?? ''];

  if (!record.canEdit || readOnly) {
    return (
      <div className="h-full w-full cursor-pointer p-0">
        {selectedOption ? (
          <SelectOptionBadge
            name={selectedOption.name}
            color={selectedOption.color}
          />
        ) : (
          ' '
        )}
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="h-full w-full cursor-pointer p-0">
          {selectedOption ? (
            <SelectOptionBadge
              name={selectedOption.name}
              color={selectedOption.color}
            />
          ) : (
            ' '
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-1">
        <SelectFieldOptions
          field={field}
          values={[value?.value ?? '']}
          onSelect={(id) => {
            if (!record.canEdit || readOnly) return;

            if (value?.value === id) {
              clearValue();
            } else {
              setValue({
                type: 'string',
                value: id,
              });
            }
          }}
          allowAdd={true}
        />
      </PopoverContent>
    </Popover>
  );
};
