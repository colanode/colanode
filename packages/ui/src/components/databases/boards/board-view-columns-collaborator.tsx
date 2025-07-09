import { CircleAlert, CircleDashed } from 'lucide-react';
import { toast } from 'sonner';

import {
  CollaboratorFieldAttributes,
  DatabaseViewFilterAttributes,
  FieldValue,
} from '@colanode/core';
import { Avatar } from '@colanode/ui/components/avatars/avatar';
import { BoardViewColumn } from '@colanode/ui/components/databases/boards/board-view-column';
import { Spinner } from '@colanode/ui/components/ui/spinner';
import { BoardViewContext } from '@colanode/ui/contexts/board-view';
import { useDatabase } from '@colanode/ui/contexts/database';
import { useDatabaseView } from '@colanode/ui/contexts/database-view';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useQuery } from '@colanode/ui/hooks/use-query';

interface BoardViewColumnsCollaboratorProps {
  field: CollaboratorFieldAttributes;
}

export const BoardViewColumnsCollaborator = ({
  field,
}: BoardViewColumnsCollaboratorProps) => {
  const workspace = useWorkspace();
  const database = useDatabase();
  const view = useDatabaseView();

  const collaboratorCountQuery = useQuery({
    type: 'record.field.value.count',
    databaseId: database.id,
    filters: view.filters,
    fieldId: field.id,
    accountId: workspace.accountId,
    workspaceId: workspace.id,
  });

  if (collaboratorCountQuery.isPending) {
    return null;
  }

  const collaborators = collaboratorCountQuery.data?.values ?? [];
  const noValueFilter: DatabaseViewFilterAttributes = {
    id: '1',
    type: 'field',
    fieldId: field.id,
    operator: 'is_empty',
  };
  const noValueCount = collaboratorCountQuery.data?.noValueCount ?? 0;

  return (
    <>
      {collaborators.map((collaborator) => {
        const filter: DatabaseViewFilterAttributes = {
          id: '1',
          type: 'field',
          fieldId: field.id,
          operator: 'is_in',
          value: [collaborator.value],
        };

        return (
          <BoardViewContext.Provider
            key={collaborator.value}
            value={{
              field,
              filter,
              canDrop: () => true,
              drop: () => {
                return {
                  type: 'string_array',
                  value: [collaborator.value],
                };
              },
              header: (
                <BoardViewColumnCollaboratorHeader
                  field={field}
                  collaborator={collaborator.value}
                  count={collaborator.count}
                />
              ),
              canDrag: (record) => record.canEdit,
              onDragEnd: async (record, value) => {
                if (!value) {
                  const result = await window.colanode.executeMutation({
                    type: 'record.field.value.delete',
                    recordId: record.id,
                    fieldId: field.id,
                    accountId: workspace.accountId,
                    workspaceId: workspace.id,
                  });

                  if (!result.success) {
                    toast.error(result.error.message);
                  }
                } else {
                  if (value.type !== 'string_array') {
                    return;
                  }

                  let newValue: FieldValue = value;
                  const currentValue = record.fields[field.id];
                  if (currentValue && currentValue.type === 'string_array') {
                    const newOptions = [
                      ...currentValue.value.filter(
                        (collaboratorId) =>
                          collaboratorId !== collaborator.value
                      ),
                      ...newValue.value,
                    ];

                    newValue = {
                      type: 'string_array',
                      value: newOptions,
                    };
                  }

                  const result = await window.colanode.executeMutation({
                    type: 'record.field.value.set',
                    recordId: record.id,
                    fieldId: field.id,
                    value: newValue,
                    accountId: workspace.accountId,
                    workspaceId: workspace.id,
                  });

                  if (!result.success) {
                    toast.error(result.error.message);
                  }
                }
              },
            }}
          >
            <BoardViewColumn />
          </BoardViewContext.Provider>
        );
      })}
      <BoardViewContext.Provider
        value={{
          field,
          filter: noValueFilter,
          canDrop: () => true,
          drop: () => {
            return null;
          },
          header: (
            <BoardViewColumnCollaboratorHeader
              field={field}
              collaborator={null}
              count={noValueCount}
            />
          ),
          canDrag: () => true,
          onDragEnd: async (record, value) => {
            if (!value) {
              const result = await window.colanode.executeMutation({
                type: 'record.field.value.delete',
                recordId: record.id,
                fieldId: field.id,
                accountId: workspace.accountId,
                workspaceId: workspace.id,
              });

              if (!result.success) {
                toast.error(result.error.message);
              }
            } else {
              const result = await window.colanode.executeMutation({
                type: 'record.field.value.set',
                recordId: record.id,
                fieldId: field.id,
                value,
                accountId: workspace.accountId,
                workspaceId: workspace.id,
              });

              if (!result.success) {
                toast.error(result.error.message);
              }
            }
          },
        }}
      >
        <BoardViewColumn />
      </BoardViewContext.Provider>
    </>
  );
};

interface BoardViewColumnCollaboratorHeaderProps {
  field: CollaboratorFieldAttributes;
  collaborator: string | null;
  count: number;
}

const BoardViewColumnCollaboratorHeader = ({
  field,
  collaborator,
  count,
}: BoardViewColumnCollaboratorHeaderProps) => {
  const workspace = useWorkspace();

  const userQuery = useQuery(
    {
      type: 'user.get',
      userId: collaborator ?? '',
      accountId: workspace.accountId,
      workspaceId: workspace.id,
    },
    {
      enabled: !!collaborator,
    }
  );

  if (!collaborator) {
    return (
      <div className="flex flex-row gap-2 items-center">
        <CircleDashed className="size-5" />
        <p className="text-muted-foreground">No {field.name}</p>
        <p className="text-muted-foreground text-sm ml-1">
          {count.toLocaleString()}
        </p>
      </div>
    );
  }

  if (userQuery.isPending) {
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
