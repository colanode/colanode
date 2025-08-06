import { TableCell } from '@tiptap/extension-table/cell';
import { ReactNodeViewRenderer } from '@tiptap/react';

import { TableCellNodeView } from '@colanode/ui/editor/views';

export const TableCellNode = TableCell.extend({
  addNodeView() {
    return ReactNodeViewRenderer(TableCellNodeView, {
      as: 'td',
      className: 'border w-20',
    });
  },
});
