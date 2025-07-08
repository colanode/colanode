import { useRef } from 'react';
import { useDrag } from 'react-dnd';

import { FieldValue } from '@colanode/core';
import { RecordFieldValue } from '@colanode/ui/components/records/record-field-value';
import { useBoardView } from '@colanode/ui/contexts/board-view';
import { useDatabaseView } from '@colanode/ui/contexts/database-view';
import { useLayout } from '@colanode/ui/contexts/layout';
import { useRecord } from '@colanode/ui/contexts/record';

export const BoardViewRecordCard = () => {
  const layout = useLayout();
  const view = useDatabaseView();
  const boardView = useBoardView();
  const record = useRecord();

  const [, drag] = useDrag({
    type: 'board-record',
    canDrag: () => boardView.canDrag(record),
    item: record,
    end: (item, monitor) => {
      const value = monitor.getDropResult() as { value: FieldValue | null };
      return boardView.onDragEnd(item, value.value);
    },
  });

  const buttonRef = useRef<HTMLButtonElement>(null);
  const dragRef = drag(buttonRef);
  const name = record.name;
  const hasName = name !== null && name !== '';

  return (
    <div
      ref={dragRef as React.Ref<HTMLDivElement>}
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
