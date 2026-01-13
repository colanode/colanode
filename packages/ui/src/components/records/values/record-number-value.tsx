import { useEffect, useState } from 'react';

import { NumberFieldValue, type NumberFieldAttributes } from '@colanode/core';
import { Input } from '@colanode/ui/components/ui/input';
import { useRecord } from '@colanode/ui/contexts/record';
import { useRecordField } from '@colanode/ui/hooks/use-record-field';

interface RecordNumberValueProps {
  field: NumberFieldAttributes;
  readOnly?: boolean;
}

export const RecordNumberValue = ({
  field,
  readOnly,
}: RecordNumberValueProps) => {
  const record = useRecord();
  const { value, setValue, clearValue } = useRecordField<NumberFieldValue>({
    field,
  });

  const [localValue, setLocalValue] = useState<string>(
    value?.value?.toString() ?? ''
  );

  useEffect(() => {
    setLocalValue(value?.value?.toString() ?? '');
  }, [value?.value]);

  const handleBlur = () => {
    if (!record.canEdit || readOnly) return;

    const trimmedValue = localValue.trim();
    if (trimmedValue === '') {
      clearValue();
      return;
    }

    const newValue = parseFloat(trimmedValue);
    if (isNaN(newValue)) {
      setLocalValue(value?.value?.toString() ?? '');
      return;
    }

    if (newValue === value?.value) {
      return;
    }

    setValue({
      type: 'number',
      value: newValue,
    });
  };

  return (
    <Input
      value={localValue}
      readOnly={!record.canEdit || readOnly}
      onChange={(e) => {
        if (!record.canEdit || readOnly) return;
        setLocalValue(e.target.value);
      }}
      onBlur={handleBlur}
      className="flex h-full w-full cursor-pointer flex-row items-center gap-1 border-none p-0 text-sm focus-visible:cursor-text shadow-none"
    />
  );
};
