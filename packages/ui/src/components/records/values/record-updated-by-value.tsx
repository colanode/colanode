import { Fragment } from 'react';

import { UpdatedByFieldAttributes } from '@colanode/core';
import { Avatar } from '@colanode/ui/components/avatars/avatar';
import { useRecord } from '@colanode/ui/contexts/record';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useQuery } from '@colanode/ui/hooks/use-query';

interface RecordUpdatedByValueProps {
  field: UpdatedByFieldAttributes;
}

export const RecordUpdatedByValue = ({ field }: RecordUpdatedByValueProps) => {
  const workspace = useWorkspace();
  const record = useRecord();

  const { data } = useQuery(
    {
      type: 'user.get',
      accountId: workspace.accountId,
      workspaceId: workspace.id,
      userId: record.updatedBy!,
    },
    {
      enabled: !!record.updatedBy,
    }
  );

  const updatedBy = data
    ? {
        name: data.name,
        avatar: data.avatar,
      }
    : null;

  return (
    <div
      className="flex h-full w-full flex-row items-center gap-1 text-sm p-0"
      data-field={field.id}
    >
      {updatedBy && (
        <Fragment>
          <Avatar
            id={record.updatedBy!}
            name={updatedBy.name}
            avatar={updatedBy.avatar}
            size="small"
          />
          <p>{updatedBy.name}</p>
        </Fragment>
      )}
    </div>
  );
};
