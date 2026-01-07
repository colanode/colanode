import { DateFieldAttributes, StringFieldValue } from '@colanode/core';
import { DatePicker } from '@colanode/ui/components/ui/date-picker';
import { useRecord } from '@colanode/ui/contexts/record';
import { useRecordField } from '@colanode/ui/hooks/use-record-field';

interface RecordDateValueProps {
  field: DateFieldAttributes;
  readOnly?: boolean;
}

export const RecordDateValue = ({ field, readOnly }: RecordDateValueProps) => {
  const record = useRecord();
  const { value, setValue, clearValue } = useRecordField<StringFieldValue>({
    field,
  });

  return (
    <DatePicker
      value={value ? new Date(value.value) : null}
      readonly={!record.canEdit || readOnly}
      onChange={(newValue) => {
        if (!record.canEdit || readOnly) return;

        if (newValue === null || newValue === undefined) {
          clearValue();
        } else {
          setValue({
            type: 'string',
            value: newValue.toISOString(),
          });
        }
      }}
      className="flex h-full w-full cursor-pointer flex-row items-center gap-1 border-none text-sm focus-visible:cursor-text p-0"
    />
  );
};
