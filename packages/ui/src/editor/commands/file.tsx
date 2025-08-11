import { FilePlus } from 'lucide-react';
import { toast } from 'sonner';

import { EditorCommand } from '@colanode/client/types';
import { openFileDialog } from '@colanode/ui/lib/files';

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

    const { accountId, workspaceId, documentId } = context;
    const result = await openFileDialog();

    if (result.type === 'success') {
      result.files.forEach(async (tempFile) => {
        const output = await window.colanode.executeMutation({
          type: 'file.create',
          tempFileId: tempFile.id,
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
      });
    } else if (result.type === 'error') {
      toast.error(result.error);
    }
  },
};
