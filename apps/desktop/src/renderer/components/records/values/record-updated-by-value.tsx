import React from 'react';
import { Avatar } from '@/renderer/components/avatars/avatar';
import { UpdatedByFieldAttributes } from '@colanode/core';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useQuery } from '@/renderer/hooks/use-query';
import { useRecord } from '@/renderer/contexts/record';

interface RecordUpdatedByValueProps {
  field: UpdatedByFieldAttributes;
}

export const RecordUpdatedByValue = ({ field }: RecordUpdatedByValueProps) => {
  const workspace = useWorkspace();
  const record = useRecord();

  const { data } = useQuery(
    {
      type: 'node_get',
      nodeId: record.updatedBy,
      userId: workspace.userId,
    },
    {
      enabled: !!record.updatedBy,
    }
  );

  const updatedBy =
    data && data.attributes.type === 'user'
      ? {
          name: data.attributes.name,
          avatar: data.attributes.avatar,
        }
      : null;

  return (
    <div
      className="flex h-full w-full flex-row items-center gap-1 text-sm p-0"
      data-field={field.id}
    >
      {updatedBy && (
        <React.Fragment>
          <Avatar
            id={record.updatedBy}
            name={updatedBy.name}
            avatar={updatedBy.avatar}
            size="small"
          />
          <p>{updatedBy.name}</p>
        </React.Fragment>
      )}
    </div>
  );
};
