import { mergeAttributes, Node } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';

import { MobilePageNodeView } from '../views/page';

export const MobilePageNode = Node.create({
  name: 'page',
  group: 'block',
  atom: true,
  defining: true,
  draggable: false,
  addAttributes() {
    return {
      id: {
        default: null,
      },
    };
  },
  renderHTML({ HTMLAttributes }) {
    return ['page', mergeAttributes(HTMLAttributes)];
  },
  addNodeView() {
    return ReactNodeViewRenderer(MobilePageNodeView, {
      as: 'page',
    });
  },
});
