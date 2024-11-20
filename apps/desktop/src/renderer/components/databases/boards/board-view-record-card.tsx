import React from 'react';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { SelectFieldAttributes, SelectOptionAttributes } from '@colanode/core';
import { useDrag } from 'react-dnd';
import { useView } from '@/renderer/contexts/view';
import { RecordFieldValue } from '@/renderer/components/records/record-field-value';
import { useRecord } from '@/renderer/contexts/record';

interface DragResult {
  option: SelectOptionAttributes;
  field: SelectFieldAttributes;
}

export const BoardViewRecordCard = () => {
  const workspace = useWorkspace();
  const view = useView();
  const record = useRecord();

  const [, drag] = useDrag({
    type: 'board-record',
    item: { id: record.id },
    canDrag: () => {
      return record.canEdit;
    },
    end: (_, monitor) => {
      const dropResult = monitor.getDropResult<DragResult>();
      if (dropResult != null) {
        const optionId = dropResult.option.id;
        const currentFieldValue = record.getSelectValue(dropResult.field);

        if (currentFieldValue === optionId) {
          return;
        }

        record.updateFieldValue(dropResult.field, {
          type: 'select',
          value: optionId,
        });
      }
    },
  });

  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const dragRef = drag(buttonRef);
  const name = record.name;
  const hasName = name !== null && name !== '';

  return (
    <div
      ref={dragRef as any}
      role="presentation"
      key={record.id}
      className="animate-fade-in flex cursor-pointer flex-col gap-1 rounded-md border p-2 text-left hover:bg-gray-50"
      onClick={() => workspace.openInModal(record.id)}
    >
      <p className={hasName ? '' : 'text-muted-foreground'}>
        {hasName ? name : 'Unnamed'}
      </p>
      {view.fields.length > 0 && (
        <div className="flex flex-col gap-1 mt-2">
          {view.fields.map((viewField) => {
            if (!viewField.display) {
              return null;
            }

            return (
              <div key={viewField.field.id}>
                <RecordFieldValue field={viewField.field} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
