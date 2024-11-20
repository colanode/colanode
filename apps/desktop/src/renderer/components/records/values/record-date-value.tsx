import { DateFieldAttributes } from '@colanode/core';
import { DatePicker } from '@/renderer/components/ui/date-picker';
import { useRecord } from '@/renderer/contexts/record';

interface RecordDateValueProps {
  field: DateFieldAttributes;
}

export const RecordDateValue = ({ field }: RecordDateValueProps) => {
  const record = useRecord();

  return (
    <DatePicker
      value={record.getDateValue(field)}
      readonly={!record.canEdit}
      onChange={(newValue) => {
        if (!record.canEdit) return;

        if (newValue === null || newValue === undefined) {
          record.removeFieldValue(field);
        } else {
          record.updateFieldValue(field, {
            type: 'date',
            value: newValue.toISOString(),
          });
        }
      }}
      className="flex h-full w-full cursor-pointer flex-row items-center gap-1 border-none text-sm focus-visible:cursor-text p-0"
    />
  );
};
