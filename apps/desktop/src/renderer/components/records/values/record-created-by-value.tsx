import { CreatedByFieldAttributes } from '@colanode/core';

import { Avatar } from '@/renderer/components/avatars/avatar';
import { useRecord } from '@/renderer/contexts/record';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useQuery } from '@/renderer/hooks/use-query';

interface RecordCreatedByValueProps {
  field: CreatedByFieldAttributes;
}

export const RecordCreatedByValue = ({ field }: RecordCreatedByValueProps) => {
  const workspace = useWorkspace();
  const record = useRecord();
  const { data } = useQuery({
    type: 'node_get',
    nodeId: record.createdBy,
    userId: workspace.userId,
  });

  const createdBy =
    data && data.attributes.type === 'user'
      ? {
          name: data.attributes.name,
          avatar: data.attributes.avatar,
        }
      : {
          name: 'Unknown',
          avatar: null,
        };

  return (
    <div
      className="flex h-full w-full flex-row items-center gap-1 text-sm p-0"
      data-field={field.id}
    >
      <Avatar
        id={record.createdBy}
        name={createdBy.name}
        avatar={createdBy.avatar}
        size="small"
      />
      <p>{createdBy.name}</p>
    </div>
  );
};
