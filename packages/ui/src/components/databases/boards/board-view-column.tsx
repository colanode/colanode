import { useRef } from 'react';
import { useDrop } from 'react-dnd';

import { BoardViewColumnRecords } from '@colanode/ui/components/databases/boards/board-view-column-records';
import { useBoardView } from '@colanode/ui/contexts/board-view';
import { cn } from '@colanode/ui/lib/utils';

export const BoardViewColumn = () => {
  const boardView = useBoardView();

  const [{ isOver }, drop] = useDrop({
    accept: 'board-record',
    drop: (item) => {
      const value = boardView.drop(item);
      return {
        value,
      };
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
    canDrop: boardView.canDrop,
  });

  const divRef = useRef<HTMLDivElement>(null);
  const dropRef = drop(divRef);
  const dragOverClass = boardView.dragOverClass ?? 'bg-muted';

  return (
    <div
      ref={dropRef as React.Ref<HTMLDivElement>}
      className={cn('min-h-[400px] border-r p-1', isOver ? dragOverClass : '')}
      style={{
        minWidth: '250px',
        maxWidth: '250px',
        width: '250px',
      }}
    >
      <div className="flex flex-row items-center gap-2">{boardView.header}</div>
      <BoardViewColumnRecords />
    </div>
  );
};
