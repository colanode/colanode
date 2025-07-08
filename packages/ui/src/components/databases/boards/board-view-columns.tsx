import { FieldAttributes } from '@colanode/core';
import { BoardViewMultiSelectColumns } from '@colanode/ui/components/databases/boards/board-view-multi-select-columns';
import { BoardViewSelectColumns } from '@colanode/ui/components/databases/boards/board-view-select-columns';

interface BoardViewColumnsProps {
  field: FieldAttributes;
}

export const BoardViewColumns = ({ field }: BoardViewColumnsProps) => {
  switch (field.type) {
    case 'select':
      return <BoardViewSelectColumns field={field} />;
    case 'multi_select':
      return <BoardViewMultiSelectColumns field={field} />;
    default:
      return <p>Unsupported field type</p>;
  }
};
