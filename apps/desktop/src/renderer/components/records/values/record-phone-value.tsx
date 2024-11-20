import { PhoneFieldAttributes } from '@colanode/core';
import { SmartTextInput } from '@/renderer/components/ui/smart-text-input';
import { useRecord } from '@/renderer/contexts/record';

interface RecordPhoneValueProps {
  field: PhoneFieldAttributes;
}

export const RecordPhoneValue = ({ field }: RecordPhoneValueProps) => {
  const record = useRecord();

  return (
    <SmartTextInput
      value={record.getPhoneValue(field)}
      readOnly={!record.canEdit}
      onChange={(newValue) => {
        if (!record.canEdit) return;

        if (newValue === record.getPhoneValue(field)) {
          return;
        }

        if (newValue === null || newValue === '') {
          record.removeFieldValue(field);
        } else {
          record.updateFieldValue(field, {
            type: 'phone',
            value: newValue,
          });
        }
      }}
      className="flex h-full w-full cursor-pointer flex-row items-center gap-1 p-0 border-none text-sm focus-visible:cursor-text"
    />
  );
};
