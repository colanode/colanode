import { EmailFieldAttributes } from '@colanode/core';
import { SmartTextInput } from '@colanode/ui/components/ui/smart-text-input';
import { useRecord } from '@colanode/ui/contexts/record';

interface RecordEmailValueProps {
  field: EmailFieldAttributes;
  readOnly?: boolean;
}

export const RecordEmailValue = ({
  field,
  readOnly,
}: RecordEmailValueProps) => {
  const record = useRecord();

  return (
    <SmartTextInput
      value={record.getEmailValue(field)}
      readOnly={!record.canEdit || readOnly}
      onChange={(newValue) => {
        if (!record.canEdit) return;

        if (newValue === null || newValue === '') {
          record.removeFieldValue(field);
        } else {
          record.updateFieldValue(field, {
            type: 'string',
            value: newValue,
          });
        }
      }}
      className="flex h-full w-full cursor-pointer flex-row items-center gap-1 border-none text-sm p-0 shadow-none focus-visible:cursor-text"
    />
  );
};
