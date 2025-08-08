import { TableHeader } from '@tiptap/extension-table/header';
import { ReactNodeViewRenderer } from '@tiptap/react';

import { defaultClasses } from '@colanode/ui/editor/classes';
import { TableHeaderNodeView } from '@colanode/ui/editor/views';

export const TableHeaderNode = TableHeader.extend({
  addNodeView() {
    return ReactNodeViewRenderer(TableHeaderNodeView, {
      as: 'th',
      className: defaultClasses.tableHeaderWrapper,
    });
  },
  addAttributes() {
    return {
      colspan: {
        default: 1,
      },
      rowspan: {
        default: 1,
      },
      colwidth: {
        default: null,
        parseHTML: (element: HTMLElement) => {
          const colwidth = element.getAttribute('colwidth');
          const value = colwidth
            ? colwidth.split(',').map((width: string) => parseInt(width, 10))
            : null;

          return value;
        },
      },
      align: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('data-align'),
      },
      backgroundColor: {
        default: null,
        parseHTML: (element: HTMLElement) =>
          element.getAttribute('data-background-color'),
      },
    };
  },
});
