import { BooleanFieldAttributes } from '@colanode/core';
import React from 'react';

import { Checkbox } from '@/renderer/components/ui/checkbox';
import { useRecord } from '@/renderer/contexts/record';

interface RecordBooleanValueProps {
  field: BooleanFieldAttributes;
  readOnly?: boolean;
}

export const RecordBooleanValue = ({
  field,
  readOnly,
}: RecordBooleanValueProps) => {
  const record = useRecord();

  const [input, setInput] = React.useState<boolean>(
    record.getBooleanValue(field)
  );

  React.useEffect(() => {
    setInput(record.getBooleanValue(field));
  }, [record.transactionId]);

  return (
    <div className="flex h-full w-full flex-row items-center justify-start p-0">
      <Checkbox
        checked={input}
        disabled={!record.canEdit || readOnly}
        onCheckedChange={(e) => {
          if (!record.canEdit || readOnly) return;

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
