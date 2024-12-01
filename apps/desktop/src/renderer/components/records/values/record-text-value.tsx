import { TextFieldAttributes } from '@colanode/core';

import { SmartTextInput } from '@/renderer/components/ui/smart-text-input';
import { useRecord } from '@/renderer/contexts/record';

interface RecordTextValueProps {
  field: TextFieldAttributes;
  readOnly?: boolean;
}

export const RecordTextValue = ({ field, readOnly }: RecordTextValueProps) => {
  const record = useRecord();

  return (
    <SmartTextInput
      value={record.getTextValue(field)}
      readOnly={!record.canEdit || readOnly}
      onChange={(newValue) => {
        if (!record.canEdit || readOnly) return;

        if (newValue === record.getTextValue(field)) {
          return;
        }

        if (newValue === null || newValue === '') {
          record.removeFieldValue(field);
        } else {
          record.updateFieldValue(field, {
            type: 'text',
            value: newValue,
          });
        }
      }}
      className="flex h-full w-full cursor-pointer flex-row items-center gap-1 border-none p-0 text-sm shadow-none focus-visible:cursor-text"
    />
  );
};
