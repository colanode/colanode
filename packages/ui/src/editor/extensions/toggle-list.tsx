import { Node, mergeAttributes } from '@tiptap/core';

import { defaultClasses } from '@colanode/ui/editor/classes';

export const ToggleListNode = Node.create({
  name: 'toggleList',
  group: 'block list',
  content: 'toggleItem+',
  defining: true,

  parseHTML() {
    return [{ tag: 'div[data-type="toggleList"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'toggleList',
        class: defaultClasses.toggleList,
      }),
      0,
    ];
  },
});