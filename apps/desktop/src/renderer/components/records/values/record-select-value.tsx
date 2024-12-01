import { SelectFieldAttributes } from '@colanode/core';
import React from 'react';

import { SelectFieldOptions } from '@/renderer/components/databases/fields/select-field-options';
import { SelectOptionBadge } from '@/renderer/components/databases/fields/select-option-badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/renderer/components/ui/popover';
import { useRecord } from '@/renderer/contexts/record';

interface RecordSelectValueProps {
  field: SelectFieldAttributes;
  readOnly?: boolean;
}

export const RecordSelectValue = ({
  field,
  readOnly,
}: RecordSelectValueProps) => {
  const record = useRecord();

  const [open, setOpen] = React.useState(false);
  const [selectedValue, setSelectedValue] = React.useState(
    record.getSelectValue(field)
  );

  React.useEffect(() => {
    setSelectedValue(record.getSelectValue(field));
  }, [record.transactionId]);

  const selectedOption = field.options?.[selectedValue ?? ''];

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
          values={[selectedValue ?? '']}
          onSelect={(id) => {
            if (!record.canEdit || readOnly) return;

            setSelectedValue(id);
            setOpen(false);

            if (selectedValue === id) {
              record.removeFieldValue(field);
            } else {
              record.updateFieldValue(field, {
                type: 'select',
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
