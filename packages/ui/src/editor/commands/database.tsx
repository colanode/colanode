import { Database } from 'lucide-react';

import {
  EditorCommand,
  LocalDatabaseNode,
  LocalDatabaseViewNode,
} from '@colanode/client/types';
import { IdType, generateId, generateFractionalIndex } from '@colanode/core';
import { collections } from '@colanode/ui/collections';

export const DatabaseCommand: EditorCommand = {
  key: 'database',
  name: 'Database - Full Page',
  description: 'Insert a full page database',
  keywords: ['database', 'full', 'page'],
  icon: Database,
  disabled: false,
  async handler({ editor, range, context }) {
    if (context == null) {
      return;
    }

    const { userId, documentId, rootId } = context;
    const nodes = collections.workspace(userId).nodes;
    const databaseId = generateId(IdType.Database);
    const fieldId = generateId(IdType.Field);
    const viewId = generateId(IdType.DatabaseView);

    const database: LocalDatabaseNode = {
      id: databaseId,
      type: 'database',
      name: 'Untitled',
      parentId: documentId,
      fields: {
        [generateId(IdType.Field)]: {
          id: fieldId,
          type: 'text',
          index: generateFractionalIndex(null, null),
          name: 'Comment',
        },
      },
      rootId: rootId,
      createdAt: new Date().toISOString(),
      createdBy: userId,
      updatedAt: null,
      updatedBy: null,
      localRevision: '0',
      serverRevision: '0',
    };

    const view: LocalDatabaseViewNode = {
      id: viewId,
      type: 'database_view',
      name: 'Default',
      index: generateFractionalIndex(null, null),
      layout: 'table',
      parentId: databaseId,
      rootId: databaseId,
      createdAt: new Date().toISOString(),
      createdBy: userId,
      updatedAt: null,
      updatedBy: null,
      localRevision: '0',
      serverRevision: '0',
    };

    nodes.insert([database, view]);

    editor
      .chain()
      .focus()
      .deleteRange(range)
      .insertContent({
        type: 'database',
        attrs: {
          id: database.id,
        },
      })
      .run();
  },
};
