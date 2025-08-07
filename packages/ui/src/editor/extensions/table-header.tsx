import { TableHeader } from '@tiptap/extension-table/header';
import { ReactNodeViewRenderer } from '@tiptap/react';

import { TableHeaderNodeView } from '@colanode/ui/editor/views';

export const TableHeaderNode = TableHeader.extend({
  addNodeView() {
    return ReactNodeViewRenderer(TableHeaderNodeView, {
      as: 'th',
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
