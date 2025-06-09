import { CreatedByFieldAttributes } from '@colanode/core';
import { Avatar } from '@colanode/ui/components/avatars/avatar';
import { useRecord } from '@colanode/ui/contexts/record';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useQuery } from '@colanode/ui/hooks/use-query';

interface RecordCreatedByValueProps {
  field: CreatedByFieldAttributes;
}

export const RecordCreatedByValue = ({ field }: RecordCreatedByValueProps) => {
  const workspace = useWorkspace();
  const record = useRecord();
  const userGetQuery = useQuery({
    type: 'user.get',
    accountId: workspace.accountId,
    workspaceId: workspace.id,
    userId: record.createdBy,
  });

  const createdBy = userGetQuery.data
    ? {
        name: userGetQuery.data.name,
        avatar: userGetQuery.data.avatar,
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
