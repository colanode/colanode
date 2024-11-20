import { EmailFieldAttributes } from '@colanode/core';
import { SmartTextInput } from '@/renderer/components/ui/smart-text-input';
import { useRecord } from '@/renderer/contexts/record';

interface RecordEmailValueProps {
  field: EmailFieldAttributes;
}

export const RecordEmailValue = ({ field }: RecordEmailValueProps) => {
  const record = useRecord();

  return (
    <SmartTextInput
      value={record.getEmailValue(field)}
      readOnly={!record.canEdit}
      onChange={(newValue) => {
        if (!record.canEdit) return;

        if (newValue === null || newValue === '') {
          record.removeFieldValue(field);
        } else {
          record.updateFieldValue(field, {
            type: 'email',
            value: newValue,
          });
        }
      }}
      className="flex h-full w-full cursor-pointer flex-row items-center gap-1 border-none text-sm p-0 shadow-none focus-visible:cursor-text"
    />
  );
};
