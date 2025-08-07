import { TableCell } from '@tiptap/extension-table/cell';
import { ReactNodeViewRenderer } from '@tiptap/react';

import { TableCellNodeView } from '@colanode/ui/editor/views';

export const TableCellNode = TableCell.extend({
  addNodeView() {
    return ReactNodeViewRenderer(TableCellNodeView, {
      as: 'td',
      className: 'border',
    });
  },
  addAttributes() {
    const baseAttributes = this.parent?.() ?? {};
    return {
      ...baseAttributes,
      align: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-align'),
      },
      textColor: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-text-color'),
      },
      backgroundColor: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-background-color'),
      },
    };
  },
});
