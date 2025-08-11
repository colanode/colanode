import { Table } from 'lucide-react';

import { EditorCommand } from '@colanode/client/types';

export const TableCommand: EditorCommand = {
  key: 'table',
  name: 'Table',
  description: 'Insert a table',
  keywords: ['table', 'grid', 'rows', 'columns'],
  icon: Table,
  disabled: false,
  async handler({ editor, range }) {
    editor
      .chain()
      .focus()
      .deleteRange(range)
      .insertTable({ rows: 3, cols: 3, withHeaderRow: false })
      .run();
  },
};
