import {
  createDebugger,
  DatabaseAttributes,
  DEFAULT_PAGE_META_TYPE_NAME,
  generateFractionalIndex,
  generateId,
  IdType,
  META_TYPES_SPACE_MARKER,
  NodeAttributes,
  PageAttributes,
  SpaceAttributes,
} from '@colanode/core';

import { eventBus } from '@colanode/client/lib/event-bus';
import { mapNode } from '@colanode/client/lib/mappers';
import { WorkspaceService } from '@colanode/client/services/workspaces/workspace-service';

const debug = createDebugger('desktop:page-meta-types');

const isMetaTypeDatabase = (attributes: NodeAttributes): boolean =>
  attributes.type === 'database' &&
  (attributes.purpose ?? 'records') === 'meta_type';

export const findDefaultPageMetaTypeId = async (
  workspace: WorkspaceService
): Promise<string | null> => {
  const databases = await workspace.database
    .selectFrom('nodes')
    .selectAll()
    .where('type', '=', 'database')
    .execute();

  for (const row of databases) {
    const attributes = JSON.parse(row.attributes) as DatabaseAttributes;
    if (
      isMetaTypeDatabase(attributes) &&
      attributes.name === DEFAULT_PAGE_META_TYPE_NAME
    ) {
      return row.id;
    }
  }

  return null;
};

const findOrCreateMetaTypesSpace = async (
  workspace: WorkspaceService
): Promise<string> => {
  const spaces = await workspace.database
    .selectFrom('nodes')
    .selectAll()
    .where('type', '=', 'space')
    .execute();

  for (const row of spaces) {
    const attributes = JSON.parse(row.attributes) as SpaceAttributes;
    if (attributes.description === META_TYPES_SPACE_MARKER) {
      return row.id;
    }
  }

  const spaceId = generateId(IdType.Space);
  const createdAt = new Date().toISOString();
  const spaceAttributes: SpaceAttributes = {
    type: 'space',
    name: 'Meta Types',
    description: META_TYPES_SPACE_MARKER,
    collaborators: {
      [workspace.userId]: 'admin',
    },
    visibility: 'private',
  };

  await workspace.nodes.insertNode(spaceId, spaceAttributes);
  debug(`Created meta types space ${spaceId}`);
  return spaceId;
};

const createDefaultPageMetaType = async (
  workspace: WorkspaceService,
  spaceId: string
): Promise<string> => {
  const databaseId = generateId(IdType.Database);
  const viewId = generateId(IdType.DatabaseView);

  await workspace.nodes.insertNode(databaseId, {
    type: 'database',
    name: DEFAULT_PAGE_META_TYPE_NAME,
    parentId: spaceId,
    purpose: 'meta_type',
    fields: {},
  });

  await workspace.nodes.insertNode(viewId, {
    type: 'database_view',
    name: 'Default',
    parentId: databaseId,
    index: generateFractionalIndex(null, null),
    layout: 'table',
  });

  debug(`Created default Page meta type ${databaseId}`);
  return databaseId;
};

const readPageMetaTypeId = (
  attributes: PageAttributes & { metaTypeId?: string }
): string | null => {
  return typeof attributes.metaTypeId === 'string' && attributes.metaTypeId.length > 0
    ? attributes.metaTypeId
    : null;
};

const forcePageMetaTypeId = async (
  workspace: WorkspaceService,
  pageId: string,
  metaTypeId: string
): Promise<void> => {
  const row = await workspace.database
    .selectFrom('nodes')
    .selectAll()
    .where('id', '=', pageId)
    .where('type', '=', 'page')
    .executeTakeFirst();

  if (!row) {
    return;
  }

  const attributes = JSON.parse(row.attributes) as PageAttributes & {
    metaTypeId?: string;
  };

  if (readPageMetaTypeId(attributes) === metaTypeId) {
    return;
  }

  const nextAttributes: PageAttributes = {
    ...attributes,
    type: 'page',
    name: attributes.name,
    parentId: attributes.parentId,
    metaTypeId,
    fields: attributes.fields ?? {},
  };

  const updatedRow = await workspace.database
    .updateTable('nodes')
    .set({
      attributes: JSON.stringify(nextAttributes),
      updated_at: new Date().toISOString(),
      updated_by: workspace.userId,
    })
    .where('id', '=', pageId)
    .returningAll()
    .executeTakeFirst();

  if (!updatedRow) {
    return;
  }

  debug(`Backfilled page ${pageId} with meta type ${metaTypeId}`);

  eventBus.publish({
    type: 'node.updated',
    workspace: {
      workspaceId: workspace.workspaceId,
      userId: workspace.userId,
      accountId: workspace.accountId,
    },
    node: mapNode(updatedRow),
  });
};

export const ensurePageMetaTypes = async (
  workspace: WorkspaceService
): Promise<void> => {
  let defaultMetaTypeId = await findDefaultPageMetaTypeId(workspace);

  if (!defaultMetaTypeId) {
    const spaceId = await findOrCreateMetaTypesSpace(workspace);
    defaultMetaTypeId = await createDefaultPageMetaType(workspace, spaceId);
  }

  const metaTypeIds = new Set<string>();
  const databases = await workspace.database
    .selectFrom('nodes')
    .select(['id', 'attributes'])
    .where('type', '=', 'database')
    .execute();

  for (const database of databases) {
    const attributes = JSON.parse(database.attributes) as DatabaseAttributes;
    if (isMetaTypeDatabase(attributes)) {
      metaTypeIds.add(database.id);
    }
  }

  const pages = await workspace.database
    .selectFrom('nodes')
    .select(['id', 'attributes'])
    .where('type', '=', 'page')
    .execute();

  for (const page of pages) {
    const attributes = JSON.parse(page.attributes) as PageAttributes & {
      metaTypeId?: string;
    };
    const metaTypeId = readPageMetaTypeId(attributes);

    if (metaTypeId && metaTypeIds.has(metaTypeId)) {
      continue;
    }

    await workspace.nodes.updateNode(page.id, (draft) => {
      if (draft.type !== 'page') {
        return draft;
      }

      draft.metaTypeId = defaultMetaTypeId!;
      if (!draft.fields) {
        draft.fields = {};
      }

      return draft;
    });

    await forcePageMetaTypeId(workspace, page.id, defaultMetaTypeId);
  }

  for (const database of databases) {
    const attributes = JSON.parse(database.attributes) as DatabaseAttributes;

    if (attributes.purpose) {
      continue;
    }

    await workspace.nodes.updateNode(database.id, (draft) => {
      if (draft.type !== 'database') {
        return draft;
      }

      draft.purpose = 'records';
      return draft;
    });
  }
};
