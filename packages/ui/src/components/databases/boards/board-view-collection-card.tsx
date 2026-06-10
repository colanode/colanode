import { useRef } from 'react';
import { useDrag } from 'react-dnd';

import { FieldValue } from '@colanode/core';
import { CollectionViewCard } from '@colanode/ui/components/databases/collection-view-card';
import { useBoardView } from '@colanode/ui/contexts/board-view';
import { useEntity } from '@colanode/ui/hooks/use-entity';
import { CollectionRow } from '@colanode/ui/lib/collection-row';

interface BoardViewCollectionCardProps {
  row: CollectionRow;
}

export const BoardViewCollectionCard = ({ row }: BoardViewCollectionCardProps) => {
  const boardView = useBoardView();
  const entity = useEntity();

  const item = {
    id: row.id,
    name: row.name,
    fields: row.fields,
    canEdit: entity.canEdit,
  };

  const [, drag] = useDrag({
    type: 'board-record',
    canDrag: () => boardView.canDrag(item),
    item,
    end: (_item, monitor) => {
      const value = monitor.getDropResult() as { value: FieldValue | null };
      return boardView.onDragEnd(item, value.value);
    },
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = drag(containerRef);

  return (
    <div ref={dragRef as React.Ref<HTMLDivElement>} role="presentation">
      <CollectionViewCard row={row} compact />
    </div>
  );
};
