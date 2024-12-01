import { NodeTypes } from '@colanode/core';
import { Folder } from 'lucide-react';

import { EditorCommand } from '@/shared/types/editor';

export const FolderCommand: EditorCommand = {
  key: 'folder',
  name: 'Folder',
  description: 'Insert a nested folder',
  keywords: ['folder'],
  icon: Folder,
  disabled: false,
  async handler({ editor, range, context }) {
    if (context == null) {
      return;
    }

    const { userId, documentId } = context;
    const output = await window.colanode.executeMutation({
      type: 'folder_create',
      name: 'Untitled',
      avatar: null,
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
        type: NodeTypes.Folder,
        attrs: {
          id: output.id,
        },
      })
      .run();
  },
};
