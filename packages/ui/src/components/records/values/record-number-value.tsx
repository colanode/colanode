import { type NumberFieldAttributes } from '@colanode/core';
import { SmartNumberInput } from '@colanode/ui/components/ui/smart-number-input';
import { useRecord } from '@colanode/ui/contexts/record';

interface RecordNumberValueProps {
  field: NumberFieldAttributes;
  readOnly?: boolean;
}

export const RecordNumberValue = ({
  field,
  readOnly,
}: RecordNumberValueProps) => {
  const record = useRecord();

  return (
    <SmartNumberInput
      value={record.getNumberValue(field)}
      readOnly={!record.canEdit || readOnly}
      onChange={(newValue) => {
        if (!record.canEdit || readOnly) return;

        if (newValue === record.getNumberValue(field)) {
          return;
        }

        if (newValue === null) {
          record.removeFieldValue(field);
        } else {
          record.updateFieldValue(field, {
            type: 'number',
            value: newValue,
          });
        }
      }}
      className="flex h-full w-full cursor-pointer flex-row items-center gap-1 border-none p-0 text-sm focus-visible:cursor-text shadow-none"
    />
  );
};
