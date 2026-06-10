import { eq, useLiveQuery as useLiveQueryTanstack } from '@tanstack/react-db';
import { CircleAlert } from 'lucide-react';

import { CreatedByFieldAttributes, DatabaseViewFilterAttributes } from '@colanode/core';
import { Avatar } from '@colanode/ui/components/avatars/avatar';
import { BoardViewColumn } from '@colanode/ui/components/databases/boards/board-view-column';
import { Spinner } from '@colanode/ui/components/ui/spinner';
import { BoardViewContext } from '@colanode/ui/contexts/board-view';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useFieldValueCounts } from '@colanode/ui/hooks/use-field-value-counts';

interface BoardViewColumnsCreatedByProps {
  field: CreatedByFieldAttributes;
}

export const BoardViewColumnsCreatedBy = ({
  field,
}: BoardViewColumnsCreatedByProps) => {
  const { values: users, isPending } = useFieldValueCounts(field);

  if (isPending) {
    return null;
  }

  return (
    <>
      {users.map((user) => {
        const filter: DatabaseViewFilterAttributes = {
          id: '1',
          type: 'field',
          fieldId: field.id,
          operator: 'is_in',
          value: [user.value],
        };

        return (
          <BoardViewContext.Provider
            key={user.value}
            value={{
              field,
              filter,
              canDrop: () => false,
              drop: () => null,
              header: (
                <BoardViewColumnCreatedByHeader
                  field={field}
                  createdBy={user.value}
                  count={user.count}
                />
              ),
              canDrag: () => false,
              onDragEnd: () => {},
            }}
          >
            <BoardViewColumn />
          </BoardViewContext.Provider>
        );
      })}
    </>
  );
};

interface BoardViewColumnCreatedByHeaderProps {
  field: CreatedByFieldAttributes;
  createdBy: string;
  count: number;
}

const BoardViewColumnCreatedByHeader = ({
  createdBy,
  count,
}: BoardViewColumnCreatedByHeaderProps) => {
  const workspace = useWorkspace();

  const userQuery = useLiveQueryTanstack((q) =>
    q
      .from({ users: workspace.collections.users })
      .where(({ users }) => eq(users.id, createdBy))
      .select(({ users }) => ({
        id: users.id,
        name: users.name,
        avatar: users.avatar,
      }))
      .findOne()
  );

  if (userQuery.isLoading) {
    return (
      <div className="flex flex-row gap-2 items-center">
        <Spinner className="size-5" />
        <p className="text-muted-foreground">Loading...</p>
        <p className="text-muted-foreground text-sm ml-1">
          {count.toLocaleString()}
        </p>
      </div>
    );
  }

  const user = userQuery.data;
  if (!user) {
    return (
      <div className="flex flex-row gap-2 items-center">
        <CircleAlert className="size-5" />
        <p className="text-muted-foreground">Unknown</p>
        <p className="text-muted-foreground text-sm ml-1">
          {count.toLocaleString()}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-row gap-2 items-center">
      <Avatar
        id={user.id}
        name={user.name}
        avatar={user.avatar}
        className="size-5"
      />
      <p>{user.name}</p>
      <p className="text-muted-foreground text-sm ml-1">
        {count.toLocaleString()}
      </p>
    </div>
  );
};
