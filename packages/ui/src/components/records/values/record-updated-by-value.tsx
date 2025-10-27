import { eq, useLiveQuery } from '@tanstack/react-db';

import { UpdatedByFieldAttributes } from '@colanode/core';
import { collections } from '@colanode/ui/collections';
import { Avatar } from '@colanode/ui/components/avatars/avatar';
import { useRecord } from '@colanode/ui/contexts/record';
import { useWorkspace } from '@colanode/ui/contexts/workspace';

interface RecordUpdatedByValueProps {
  field: UpdatedByFieldAttributes;
}

export const RecordUpdatedByValue = ({ field }: RecordUpdatedByValueProps) => {
  const workspace = useWorkspace();
  const record = useRecord();

  const userQuery = useLiveQuery((q) =>
    q
      .from({ users: collections.workspace(workspace.userId).users })
      .where(({ users }) => eq(users.id, record.updatedBy))
      .select(({ users }) => ({
        id: users.id,
        name: users.name,
        avatar: users.avatar,
      }))
      .findOne()
  );

  const user = userQuery.data;
  return (
    <div
      className="flex h-full w-full flex-row items-center gap-1 text-sm p-0"
      data-field={field.id}
    >
      {user && (
        <>
          <Avatar
            id={record.updatedBy!}
            name={user.name}
            avatar={user.avatar}
            size="small"
          />
          <p>{user.name}</p>
        </>
      )}
    </div>
  );
};
