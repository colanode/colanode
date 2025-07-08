import { toast } from 'sonner';

import {
  DatabaseViewFilterAttributes,
  FieldValue,
  MultiSelectFieldAttributes,
} from '@colanode/core';
import { BoardViewColumn } from '@colanode/ui/components/databases/boards/board-view-column';
import { SelectOptionBadge } from '@colanode/ui/components/databases/fields/select-option-badge';
import { BoardViewContext } from '@colanode/ui/contexts/board-view';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { getSelectOptionLightColorClass } from '@colanode/ui/lib/databases';

interface BoardViewColumnsMultiSelectProps {
  field: MultiSelectFieldAttributes;
}

export const BoardViewColumnsMultiSelect = ({
  field,
}: BoardViewColumnsMultiSelectProps) => {
  const workspace = useWorkspace();
  const selectOptions = Object.values(field.options ?? {});

  const noValueFilter: DatabaseViewFilterAttributes = {
    id: '1',
    type: 'field',
    fieldId: field.id,
    operator: 'is_empty',
  };

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

        return (
          <BoardViewContext.Provider
            key={option.id}
            value={{
              field,
              filter,
              canDrop: () => true,
              drop: () => {
                return {
                  type: 'string_array',
                  value: [option.id],
                };
              },
              dragOverClass: draggingClass,
              header: (
                <SelectOptionBadge name={option.name} color={option.color} />
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
                        (optionId) => optionId !== option.id
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
            <p className="text-sm text-muted-foreground">No {field.name}</p>
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
