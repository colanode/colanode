import React from 'react';
import { Checkbox } from '@/renderer/components/ui/checkbox';
import { BooleanFieldAttributes } from '@colanode/core';
import { useRecord } from '@/renderer/contexts/record';

interface RecordBooleanValueProps {
  field: BooleanFieldAttributes;
}

export const RecordBooleanValue = ({ field }: RecordBooleanValueProps) => {
  const record = useRecord();

  const [input, setInput] = React.useState<boolean>(
    record.getBooleanValue(field)
  );

  React.useEffect(() => {
    setInput(record.getBooleanValue(field));
  }, [record.versionId]);

  return (
    <div className="flex h-full w-full flex-row items-center justify-start p-0">
      <Checkbox
        checked={input}
        disabled={!record.canEdit}
        onCheckedChange={(e) => {
          if (!record.canEdit) return;

          if (typeof e === 'boolean') {
            setInput(e.valueOf());
            const checked = e.valueOf();
            if (checked) {
              record.updateFieldValue(field, {
                type: 'boolean',
                value: checked,
              });
            } else {
              record.removeFieldValue(field);
            }
          }
        }}
      />
    </div>
  );
};
