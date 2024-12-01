import { NodeTypes } from '@colanode/core';
import { FileText } from 'lucide-react';

import { EditorCommand } from '@/shared/types/editor';

export const PageCommand: EditorCommand = {
  key: 'page',
  name: 'Page',
  description: 'Insert a nested page',
  keywords: ['page'],
  icon: FileText,
  disabled: false,
  async handler({ editor, range, context }) {
    if (context == null) {
      return;
    }

    const { userId, documentId } = context;
    const output = await window.colanode.executeMutation({
      type: 'page_create',
      name: 'Untitled',
      userId,
      parentId: documentId,
      generateIndex: false,
    });

    if (!output.id) {
      return;
    }

    editor
      .chain()
      .focus()
      .deleteRange(range)
      .insertContent({
        type: NodeTypes.Page,
        attrs: {
          id: output.id,
        },
      })
      .run();
  },
};
