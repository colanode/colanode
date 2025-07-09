import { CircleDashed } from 'lucide-react';
import { toast } from 'sonner';

import {
  DatabaseViewFilterAttributes,
  SelectFieldAttributes,
  SelectOptionAttributes,
} from '@colanode/core';
import { BoardViewColumn } from '@colanode/ui/components/databases/boards/board-view-column';
import { SelectOptionBadge } from '@colanode/ui/components/databases/fields/select-option-badge';
import { BoardViewContext } from '@colanode/ui/contexts/board-view';
import { useDatabase } from '@colanode/ui/contexts/database';
import { useDatabaseView } from '@colanode/ui/contexts/database-view';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useQuery } from '@colanode/ui/hooks/use-query';
import { getSelectOptionLightColorClass } from '@colanode/ui/lib/databases';

interface BoardViewColumnsSelectProps {
  field: SelectFieldAttributes;
}

export const BoardViewColumnsSelect = ({
  field,
}: BoardViewColumnsSelectProps) => {
  const workspace = useWorkspace();
  const database = useDatabase();
  const view = useDatabaseView();

  const selectOptionCountQuery = useQuery({
    type: 'record.field.value.count',
    databaseId: database.id,
    filters: view.filters,
    fieldId: field.id,
    accountId: workspace.accountId,
    workspaceId: workspace.id,
  });

  const selectOptions = Object.values(field.options ?? {});
  const noValueFilter: DatabaseViewFilterAttributes = {
    id: '1',
    type: 'field',
    fieldId: field.id,
    operator: 'is_empty',
  };

  const selectOptionCount = selectOptionCountQuery.data?.values ?? [];
  const noValueCount = selectOptionCountQuery.data?.nullCount ?? 0;

  const noValueDraggingClass = getSelectOptionLightColorClass('gray');

  return (
    <>
      {selectOptions.map((option) => {
        const filter: DatabaseViewFilterAttributes = {
          id: '1',
          type: 'field',
          fieldId: field.id,
          operator: 'is_in',
          value: [option.id],
        };

        const draggingClass = getSelectOptionLightColorClass(
          option.color ?? 'gray'
        );

        const count =
          selectOptionCount.find((count) => count.value === option.id)?.count ??
          0;

        return (
          <BoardViewContext.Provider
            key={option.id}
            value={{
              field,
              filter,
              canDrop: () => true,
              drop: () => {
                return {
                  type: 'string',
                  value: option.id,
                };
              },
              dragOverClass: draggingClass,
              header: (
                <BoardViewColumnSelectHeader
                  field={field}
                  option={option}
                  count={count}
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
            <BoardViewColumnSelectHeader
              field={field}
              option={null}
              count={noValueCount}
            />
          ),
          dragOverClass: noValueDraggingClass,
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

interface BoardViewColumnSelectHeaderProps {
  field: SelectFieldAttributes;
  option: SelectOptionAttributes | null;
  count: number;
}

const BoardViewColumnSelectHeader = ({
  field,
  option,
  count,
}: BoardViewColumnSelectHeaderProps) => {
  if (!option) {
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

  return (
    <div className="flex flex-row gap-2 items-center">
      <SelectOptionBadge name={option?.name} color={option?.color} />
      <p className="text-muted-foreground text-sm ml-1">
        {count.toLocaleString()}
      </p>
    </div>
  );
};
