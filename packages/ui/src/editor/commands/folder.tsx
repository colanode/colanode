import { Folder } from 'lucide-react';

import { EditorCommand } from '@colanode/client/types';

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

    const { accountId, workspaceId, documentId } = context;
    const output = await window.colanode.executeMutation({
      type: 'folder.create',
      name: 'Untitled',
      avatar: null,
      accountId,
      workspaceId,
      parentId: documentId,
      generateIndex: false,
    });

    if (!output.success) {
      return;
    }

    editor
      .chain()
      .focus()
      .deleteRange(range)
      .insertContent({
        type: 'folder',
        attrs: {
          id: output.output.id,
        },
      })
      .run();
  },
};
