import { ChevronRight } from 'lucide-react';

import { EditorCommand } from '@colanode/client/types';

export const ToggleListCommand: EditorCommand = {
  key: 'toggle-list',
  name: 'Toggle List',
  description: 'Insert a toggle list',
  keywords: ['toggle', 'collapsible', 'expand', 'collapse'],
  icon: ChevronRight,
  disabled: false,
  handler: ({ editor, range }) => {
    editor
      .chain()
      .focus()
      .deleteRange(range)
      .insertContent({
        type: 'toggleList',
        content: [
          {
            type: 'toggleItem',
            attrs: { expanded: false },
            content: [{ type: 'paragraph' }],
          },
        ],
      })
      .run();
  },
};