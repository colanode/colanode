import React from 'react';
import { getSelectOptionLightColorClass } from '@/lib/databases';
import { cn } from '@/lib/utils';
import { useDrop } from 'react-dnd';
import { SelectFieldAttributes, SelectOptionAttributes } from '@colanode/core';
import { BoardViewColumnHeader } from '@/renderer/components/databases/boards/board-view-column-header';
import { BoardViewColumnRecords } from '@/renderer/components/databases/boards/board-view-column-records';

interface BoardViewColumnProps {
  field: SelectFieldAttributes;
  option: SelectOptionAttributes;
}

export const BoardViewColumn = ({ field, option }: BoardViewColumnProps) => {
  const [{ isDragging }, drop] = useDrop({
    accept: 'board-record',
    drop: () => ({
      option: option,
      field: field,
    }),
    collect: (monitor) => ({
      isDragging: monitor.isOver(),
    }),
  });

  const divRef = React.useRef<HTMLDivElement>(null);
  const dropRef = drop(divRef);

  const lightClass = getSelectOptionLightColorClass(option.color ?? 'gray');
  return (
    <div
      ref={dropRef as any}
      className={cn('min-h-[400px] border-r p-1', isDragging && lightClass)}
      style={{
        minWidth: '250px',
        maxWidth: '250px',
        width: '250px',
      }}
    >
      <BoardViewColumnHeader option={option} />
      <BoardViewColumnRecords field={field} option={option} />
    </div>
  );
};