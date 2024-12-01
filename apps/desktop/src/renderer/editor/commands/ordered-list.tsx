import { ListOrdered } from 'lucide-react';

import { EditorCommand } from '@/shared/types/editor';

export const OrderedListCommand: EditorCommand = {
  key: 'ordered-list',
  name: 'Ordered List',
  description: 'Insert a numbered list',
  keywords: ['numberedlist', 'numbered', 'ordered', 'list'],
  icon: ListOrdered,
  disabled: false,
  handler: ({ editor, range }) => {
    editor.chain().focus().deleteRange(range).toggleOrderedList().run();
  },
};
