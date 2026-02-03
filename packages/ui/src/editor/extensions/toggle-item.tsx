import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';

import { defaultClasses } from '@colanode/ui/editor/classes';
import { ToggleItemNodeView } from '@colanode/ui/editor/views/toggle-item';

export const ToggleItemNode = Node.create({
  name: 'toggleItem',
  content: 'paragraph block*',
  defining: true,
  draggable: true,

  addAttributes() {
    return {
      expanded: {
        default: false,
        parseHTML: (element) => element.getAttribute('data-expanded') === 'true',
        renderHTML: (attributes) => ({
          'data-expanded': attributes.expanded,
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="toggleItem"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'toggleItem',
        class: defaultClasses.toggleItem,
      }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ToggleItemNodeView, {
      as: 'div',
    });
  },
});