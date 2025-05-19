import { FilePlus } from 'lucide-react';

import { EditorCommand } from '@colanode/client/types';

export const FileCommand: EditorCommand = {
  key: 'file',
  name: 'File',
  description: 'Insert a nested file',
  keywords: ['file', 'image', 'video', 'audio'],
  icon: FilePlus,
  disabled: false,
  async handler({ editor, range, context }) {
    if (context == null) {
      return;
    }

    const result = await window.colanode.executeCommand({
      type: 'file_dialog_open',
      options: {
        properties: ['openFile'],
        buttonLabel: 'Upload',
        title: 'Upload files to page',
      },
    });

    if (result.canceled) {
      return;
    }

    const filePath = result.filePaths[0];
    if (!filePath) {
      return;
    }

    const { accountId, workspaceId, documentId } = context;
    const output = await window.colanode.executeMutation({
      type: 'file_create',
      filePath,
      accountId,
      workspaceId,
      parentId: documentId,
    });

    if (!output.success) {
      return;
    }

    editor
      .chain()
      .focus()
      .deleteRange(range)
      .insertContent({
        type: 'file',
        attrs: {
          id: output.output.id,
        },
      })
      .run();
  },
};
