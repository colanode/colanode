import { BooleanFieldAttributes, BooleanFieldValue } from '@colanode/core';
import { Checkbox } from '@colanode/ui/components/ui/checkbox';
import { useRecord } from '@colanode/ui/contexts/record';
import { useRecordField } from '@colanode/ui/hooks/use-record-field';

interface RecordBooleanValueProps {
  field: BooleanFieldAttributes;
  readOnly?: boolean;
}

export const RecordBooleanValue = ({
  field,
  readOnly,
}: RecordBooleanValueProps) => {
  const record = useRecord();
  const { value, setValue, clearValue } = useRecordField<BooleanFieldValue>({
    field,
  });

  return (
    <div className="flex h-full w-full flex-row items-center justify-start p-0">
      <Checkbox
        checked={value?.value ?? false}
        disabled={!record.canEdit || readOnly}
        onCheckedChange={(e) => {
          if (!record.canEdit || readOnly) return;

          if (typeof e === 'boolean') {
            const checked = e.valueOf();
            if (checked) {
              setValue({
                type: 'boolean',
                value: checked,
              });
            } else {
              clearValue();
            }
          }
        }}
      />
    </div>
  );
};
