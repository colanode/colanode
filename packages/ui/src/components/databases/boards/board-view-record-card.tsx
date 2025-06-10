import { useRef } from 'react';
import { useDrag } from 'react-dnd';

import { SelectFieldAttributes, SelectOptionAttributes } from '@colanode/core';
import { RecordFieldValue } from '@colanode/ui/components/records/record-field-value';
import { useDatabaseView } from '@colanode/ui/contexts/database-view';
import { useLayout } from '@colanode/ui/contexts/layout';
import { useRecord } from '@colanode/ui/contexts/record';

interface DragResult {
  option: SelectOptionAttributes;
  field: SelectFieldAttributes;
}

export const BoardViewRecordCard = () => {
  const layout = useLayout();
  const view = useDatabaseView();
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
          type: 'string',
          value: optionId,
        });
      }
    },
  });

  const buttonRef = useRef<HTMLButtonElement>(null);
  const dragRef = drag(buttonRef);
  const name = record.name;
  const hasName = name !== null && name !== '';

  return (
    <div
      ref={dragRef as React.LegacyRef<HTMLDivElement>}
      role="presentation"
      key={record.id}
      className="animate-fade-in flex cursor-pointer flex-col gap-1 rounded-md border p-2 text-left hover:bg-gray-50"
      onClick={() => {
        layout.previewLeft(record.id, true);
      }}
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
                <RecordFieldValue field={viewField.field} readOnly={true} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
