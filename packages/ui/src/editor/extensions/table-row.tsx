import { TableRow } from '@tiptap/extension-table/row';

import { defaultClasses } from '@colanode/ui/editor/classes';

export const TableRowNode = TableRow.configure({
  HTMLAttributes: {
    class: defaultClasses.tableRow,
  },
});
