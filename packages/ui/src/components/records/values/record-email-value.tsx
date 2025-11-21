import { EmailFieldAttributes, StringFieldValue } from '@colanode/core';
import { Input } from '@colanode/ui/components/ui/input';
import { useRecord } from '@colanode/ui/contexts/record';
import { useRecordField } from '@colanode/ui/hooks/use-record-field';

interface RecordEmailValueProps {
  field: EmailFieldAttributes;
  readOnly?: boolean;
}

export const RecordEmailValue = ({
  field,
  readOnly,
}: RecordEmailValueProps) => {
  const record = useRecord();
  const { value, setValue, clearValue } = useRecordField<StringFieldValue>({
    field,
  });

  return (
    <Input
      value={value?.value ?? ''}
      readOnly={!record.canEdit || readOnly}
      onChange={(e) => {
        const newValue = e.target.value;
        if (!record.canEdit) return;

        if (newValue === null || newValue === '') {
          clearValue();
        } else {
          setValue({
            type: 'string',
            value: newValue,
          });
        }
      }}
      className="flex h-full w-full cursor-pointer flex-row items-center gap-1 border-none text-sm p-0 shadow-none focus-visible:cursor-text"
    />
  );
};
