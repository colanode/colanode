import { Folder } from 'lucide-react';

import { EditorCommand, LocalFolderNode } from '@colanode/client/types';
import { generateId, IdType } from '@colanode/core/lib/id.js';
import { collections } from '@colanode/ui/collections';

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

    const { userId, documentId, rootId } = context;
    const folderId = generateId(IdType.Folder);
    const nodes = collections.workspace(userId).nodes;

    const folder: LocalFolderNode = {
      id: folderId,
      type: 'folder',
      name: 'Untitled',
      avatar: null,
      parentId: documentId,
      rootId: rootId,
      createdAt: new Date().toISOString(),
      createdBy: userId,
      updatedAt: null,
      updatedBy: null,
      localRevision: '0',
      serverRevision: '0',
    };

    nodes.insert(folder);

    editor
      .chain()
      .focus()
      .deleteRange(range)
      .insertContent({
        type: 'folder',
        attrs: {
          id: folder.id,
        },
      })
      .run();
  },
};
