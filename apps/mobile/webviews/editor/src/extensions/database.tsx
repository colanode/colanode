import { mergeAttributes, Node } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';

import { MobileDatabaseNodeView } from '../views/database';

export const MobileDatabaseNode = Node.create({
  name: 'database',
  group: 'block',
  atom: true,
  defining: true,
  draggable: false,
  addAttributes() {
    return {
      id: {
        default: null,
      },
      inline: {
        default: false,
      },
    };
  },
  renderHTML({ HTMLAttributes }) {
    return ['database', mergeAttributes(HTMLAttributes)];
  },
  addNodeView() {
    return ReactNodeViewRenderer(MobileDatabaseNodeView, {
      as: 'database',
    });
  },
});
