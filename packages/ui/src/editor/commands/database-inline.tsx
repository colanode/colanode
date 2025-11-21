import { DatabaseZap } from 'lucide-react';

import {
  EditorCommand,
  LocalDatabaseNode,
  LocalDatabaseViewNode,
} from '@colanode/client/types';
import { IdType, generateId, generateFractionalIndex } from '@colanode/core';
import { collections } from '@colanode/ui/collections';

export const DatabaseInlineCommand: EditorCommand = {
  key: 'database-inline',
  name: 'Database - Inline',
  description: 'Insert a database inline in the current document',
  keywords: ['database', 'inline'],
  icon: DatabaseZap,
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
          inline: true,
        },
      })
      .run();
  },
};
