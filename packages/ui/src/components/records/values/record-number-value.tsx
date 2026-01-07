import { NumberFieldValue, type NumberFieldAttributes } from '@colanode/core';
import { Input } from '@colanode/ui/components/ui/input';
import { useRecord } from '@colanode/ui/contexts/record';
import { useRecordField } from '@colanode/ui/hooks/use-record-field';

interface RecordNumberValueProps {
  field: NumberFieldAttributes;
  readOnly?: boolean;
}

export const RecordNumberValue = ({
  field,
  readOnly,
}: RecordNumberValueProps) => {
  const record = useRecord();
  const { value, setValue, clearValue } = useRecordField<NumberFieldValue>({
    field,
  });

  return (
    <Input
      value={value?.value ?? undefined}
      readOnly={!record.canEdit || readOnly}
      onChange={(e) => {
        if (!record.canEdit || readOnly) return;

        const newStringValue = e.target.value;
        if (newStringValue === null || newStringValue === '') {
          clearValue();
          return;
        }

        const newValue = parseFloat(newStringValue);
        if (isNaN(newValue)) {
          return;
        }

        if (newValue === value?.value) {
          return;
        }

        setValue({
          type: 'number',
          value: newValue,
        });
      }}
      className="flex h-full w-full cursor-pointer flex-row items-center gap-1 border-none p-0 text-sm focus-visible:cursor-text shadow-none"
    />
  );
};
