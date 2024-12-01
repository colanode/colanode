import { UpdatedAtFieldAttributes } from '@colanode/core';

import { useRecord } from '@/renderer/contexts/record';

interface RecordUpdatedAtValueProps {
  field: UpdatedAtFieldAttributes;
}

export const RecordUpdatedAtValue = ({ field }: RecordUpdatedAtValueProps) => {
  const record = useRecord();
  const updatedAt = record.updatedAt ? new Date(record.updatedAt) : null;

  return (
    <div className="h-full w-full p-0 text-sm" data-field={field.id}>
      <p>
        {updatedAt?.toLocaleDateString()} {updatedAt?.toLocaleTimeString()}
      </p>
    </div>
  );
};
