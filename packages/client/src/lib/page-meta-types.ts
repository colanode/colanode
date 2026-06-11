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

import { WorkspaceService } from '@colanode/client/services/workspaces/workspace-service';

const debug = createDebugger('desktop:page-meta-types');

const isMetaTypeDatabase = (attributes: NodeAttributes): boolean =>
  attributes.type === 'database' &&
  (attributes.purpose ?? 'records') === 'meta_type';

type PageMetaTypeRow = {
  id: string;
  attributes: DatabaseAttributes;
  createdAt: string;
};

const listPageMetaTypes = async (
  workspace: WorkspaceService
): Promise<PageMetaTypeRow[]> => {
  const databases = await workspace.database
    .selectFrom('nodes')
    .select(['id', 'attributes', 'created_at'])
    .where('type', '=', 'database')
    .execute();

  return databases.flatMap((row) => {
    const attributes = JSON.parse(row.attributes) as DatabaseAttributes;
    if (
      !isMetaTypeDatabase(attributes) ||
      attributes.name !== DEFAULT_PAGE_META_TYPE_NAME
    ) {
      return [];
    }

    return [
      {
        id: row.id,
        attributes,
        createdAt: row.created_at,
      },
    ];
  });
};

const countPagesByMetaTypeId = async (
  workspace: WorkspaceService
): Promise<Map<string, number>> => {
  const pages = await workspace.database
    .selectFrom('nodes')
    .select(['meta_type_id'])
    .where('type', '=', 'page')
    .execute();

  const counts = new Map<string, number>();
  for (const page of pages) {
    if (!page.meta_type_id) {
      continue;
    }

    counts.set(page.meta_type_id, (counts.get(page.meta_type_id) ?? 0) + 1);
  }

  return counts;
};

const readPageMetaTypeId = (
  attributes: PageAttributes & { metaTypeId?: string }
): string | null => {
  return typeof attributes.metaTypeId === 'string' && attributes.metaTypeId.length > 0
    ? attributes.metaTypeId
    : null;
};

const pickCanonicalPageMetaType = (
  pageMetaTypes: PageMetaTypeRow[],
  pageCounts: Map<string, number>
): PageMetaTypeRow => {
  return [...pageMetaTypes].sort((left, right) => {
    const leftFieldCount = Object.keys(left.attributes.fields ?? {}).length;
    const rightFieldCount = Object.keys(right.attributes.fields ?? {}).length;
    if (leftFieldCount !== rightFieldCount) {
      return rightFieldCount - leftFieldCount;
    }

    const leftPageCount = pageCounts.get(left.id) ?? 0;
    const rightPageCount = pageCounts.get(right.id) ?? 0;
    if (leftPageCount !== rightPageCount) {
      return rightPageCount - leftPageCount;
    }

    const createdAtCompare = left.createdAt.localeCompare(right.createdAt);
    if (createdAtCompare !== 0) {
      return createdAtCompare;
    }

    return left.id.localeCompare(right.id);
  })[0]!;
};

const removeDuplicatePageMetaType = async (
  workspace: WorkspaceService,
  duplicateId: string
): Promise<void> => {
  const childViews = await workspace.database
    .selectFrom('nodes')
    .select(['id'])
    .where('parent_id', '=', duplicateId)
    .where('type', '=', 'database_view')
    .execute();

  for (const view of childViews) {
    await workspace.nodes.deleteNode(view.id);
  }

  await workspace.nodes.updateNode(duplicateId, (draft) => {
    if (draft.type !== 'database') {
      return draft;
    }

    draft.name = 'Page (duplicate)';
    return draft;
  });

  await workspace.nodes.deleteNode(duplicateId);
  debug(`Removed duplicate Page meta type ${duplicateId}`);
};

export const consolidateDuplicatePageMetaTypes = async (
  workspace: WorkspaceService
): Promise<string | null> => {
  const pageMetaTypes = await listPageMetaTypes(workspace);
  if (pageMetaTypes.length === 0) {
    return null;
  }

  if (pageMetaTypes.length === 1) {
    return pageMetaTypes[0]!.id;
  }

  const pageCounts = await countPagesByMetaTypeId(workspace);
  const canonical = pickCanonicalPageMetaType(pageMetaTypes, pageCounts);
  const duplicateIds = pageMetaTypes
    .map((metaType) => metaType.id)
    .filter((id) => id !== canonical.id);

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

    if (!metaTypeId || !duplicateIds.includes(metaTypeId)) {
      continue;
    }

    const result = await workspace.nodes.updateNode(
      page.id,
      (draft) => {
        if (draft.type !== 'page') {
          return draft;
        }

        draft.metaTypeId = canonical.id;
        if (!draft.fields) {
          draft.fields = {};
        }

        return draft;
      },
      { allowMetaTypeIdChange: true }
    );

    if (result !== 'success') {
      debug(
        `Failed to re-point page ${page.id} from duplicate meta type ${metaTypeId} to ${canonical.id}: ${result}`
      );
    }
  }

  for (const duplicateId of duplicateIds) {
    await removeDuplicatePageMetaType(workspace, duplicateId);
  }

  debug(
    `Consolidated ${duplicateIds.length} duplicate Page meta type(s) into ${canonical.id}`
  );

  return canonical.id;
};

export const findDefaultPageMetaTypeId = async (
  workspace: WorkspaceService
): Promise<string | null> => {
  const pageMetaTypes = await listPageMetaTypes(workspace);
  if (pageMetaTypes.length === 0) {
    return null;
  }

  if (pageMetaTypes.length === 1) {
    return pageMetaTypes[0]!.id;
  }

  const pageCounts = await countPagesByMetaTypeId(workspace);
  return pickCanonicalPageMetaType(pageMetaTypes, pageCounts).id;
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

export const ensurePageMetaTypes = async (
  workspace: WorkspaceService
): Promise<void> => {
  let defaultMetaTypeId = await consolidateDuplicatePageMetaTypes(workspace);

  if (!defaultMetaTypeId) {
    defaultMetaTypeId = await findDefaultPageMetaTypeId(workspace);
  }

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

    const result = await workspace.nodes.updateNode(
      page.id,
      (draft) => {
        if (draft.type !== 'page') {
          return draft;
        }

        draft.metaTypeId = defaultMetaTypeId!;
        if (!draft.fields) {
          draft.fields = {};
        }

        return draft;
      },
      { allowMetaTypeIdChange: true }
    );

    if (result !== 'success') {
      debug(
        `Failed to backfill page ${page.id} with meta type ${defaultMetaTypeId}: ${result}`
      );
    }
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
