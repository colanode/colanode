import { mergeAttributes, Node } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';

import { MobileFolderNodeView } from '../views/folder';

export const MobileFolderNode = Node.create({
  name: 'folder',
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
    return ['folder', mergeAttributes(HTMLAttributes)];
  },
  addNodeView() {
    return ReactNodeViewRenderer(MobileFolderNodeView, {
      as: 'folder',
    });
  },
});
