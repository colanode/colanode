import { CreatedAtFieldAttributes } from '@colanode/core';
import { useRecord } from '@/renderer/contexts/record';

interface RecordCreatedAtValueProps {
  field: CreatedAtFieldAttributes;
}

export const RecordCreatedAtValue = ({ field }: RecordCreatedAtValueProps) => {
  const record = useRecord();
  const createdAt = new Date(record.createdAt);

  return (
    <div className="h-full w-full p-1 text-sm" data-field={field.id}>
      <p>
        {createdAt.toLocaleDateString()} {createdAt.toLocaleTimeString()}
      </p>
    </div>
  );
};