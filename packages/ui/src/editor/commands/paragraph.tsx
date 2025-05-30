import { Pilcrow } from 'lucide-react';

import { EditorCommand } from '@colanode/client/types';

export const ParagraphCommand: EditorCommand = {
  key: 'paragraph',
  name: 'Text',
  description: 'Insert a text paragraph.tsx',
  keywords: ['paragraph', 'text'],
  icon: Pilcrow,
  disabled: false,
  handler: ({ editor, range }) => {
    editor
      .chain()
      .focus()
      .deleteRange(range)
      .toggleNode('paragraph', 'paragraph')
      .run();
  },
};
