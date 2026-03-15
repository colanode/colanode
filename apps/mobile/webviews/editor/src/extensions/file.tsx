import { mergeAttributes, Node } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';

import { MobileFileNodeView } from '../views/file';

export const MobileFileNode = Node.create({
  name: 'file',
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
    return ['file', mergeAttributes(HTMLAttributes)];
  },
  addNodeView() {
    return ReactNodeViewRenderer(MobileFileNodeView, {
      as: 'file',
    });
  },
});
