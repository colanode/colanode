import { Quote } from 'lucide-react';

import { EditorCommand } from '@/shared/types/editor';

export const BlockquoteCommand: EditorCommand = {
  key: 'blockquote',
  name: 'Blockquote',
  description: 'Insert a blockquote',
  keywords: ['blockquote', 'quote'],
  icon: Quote,
  disabled: false,
  handler: ({ editor, range }) => {
    editor
      .chain()
      .focus()
      .deleteRange(range)
      .toggleNode('paragraph', 'paragraph')
      .toggleBlockquote()
      .run();
  },
};
