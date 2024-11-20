import React from 'react';
import { SelectFieldAttributes } from '@colanode/core';
import { SelectOptionBadge } from '@/renderer/components/databases/fields/select-option-badge';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/renderer/components/ui/popover';
import { SelectFieldOptions } from '@/renderer/components/databases/fields/select-field-options';
import { useRecord } from '@/renderer/contexts/record';

interface RecordSelectValueProps {
  field: SelectFieldAttributes;
}

export const RecordSelectValue = ({ field }: RecordSelectValueProps) => {
  const record = useRecord();

  const [open, setOpen] = React.useState(false);
  const [selectedValue, setSelectedValue] = React.useState(
    record.getSelectValue(field)
  );

  React.useEffect(() => {
    setSelectedValue(record.getSelectValue(field));
  }, [record.versionId]);

  const selectedOption = field.options?.[selectedValue ?? ''];

  if (!record.canEdit) {
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
            if (!record.canEdit) return;

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
