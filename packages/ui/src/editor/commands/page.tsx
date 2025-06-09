import { FileText } from 'lucide-react';

import { EditorCommand } from '@colanode/client/types';

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

    const { accountId, workspaceId, documentId } = context;
    const output = await window.colanode.executeMutation({
      type: 'page.create',
      name: 'Untitled',
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
        type: 'page',
        attrs: {
          id: output.output.id,
        },
      })
      .run();
  },
};
