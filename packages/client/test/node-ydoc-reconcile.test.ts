import * as Y from 'yjs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Kysely } from 'kysely';

import { WorkspaceDatabaseSchema } from '@colanode/client/databases';
import { NodeService } from '@colanode/client/services/workspaces/node-service';
import type { WorkspaceService } from '@colanode/client/services/workspaces/workspace-service';
import { generateId, IdType, PageAttributes } from '@colanode/core';

import { createWorkspaceDatabase } from './helpers/sqlite';

const buildLegacyPageYdocUpdate = (
  name: string,
  parentId: string
): Uint8Array => {
  const doc = new Y.Doc();
  const map = doc.getMap('object');
  map.set('type', 'page');
  map.set('name', name);
  map.set('parentId', parentId);
  return Y.encodeStateAsUpdate(doc);
};

describe('node YDoc / SQLite reconciliation', () => {
  let database: Kysely<WorkspaceDatabaseSchema>;
  let nodeService: NodeService;
  const userId = generateId(IdType.User);
  const workspaceId = generateId(IdType.Workspace);
  const accountId = generateId(IdType.Account);

  beforeEach(async () => {
    database = await createWorkspaceDatabase();

    const workspace = {
      userId,
      workspaceId,
      accountId,
      role: 'owner',
      database,
      account: { app: { meta: { localOnly: true } } },
    } as unknown as WorkspaceService;

    nodeService = new NodeService(workspace);
  });

  afterEach(async () => {
    await database.destroy();
  });

  it('reconciles SQLite when YDoc already has metaTypeId', async () => {
    const spaceId = generateId(IdType.Space);
    const pageId = generateId(IdType.Page);
    const metaTypeId = generateId(IdType.Database);
    const now = new Date().toISOString();

    await database
      .insertInto('nodes')
      .values({
        id: spaceId,
        root_id: spaceId,
        attributes: JSON.stringify({
          type: 'space',
          name: 'Main',
          description: '',
          collaborators: { [userId]: 'admin' },
          visibility: 'private',
        }),
        created_at: now,
        created_by: userId,
        local_revision: '0',
        server_revision: '0',
      })
      .execute();

    const sqliteAttributes = {
      type: 'page',
      name: 'Legacy',
      parentId: spaceId,
      fields: {},
    };

    const ydocUpdate = buildLegacyPageYdocUpdate('Legacy', spaceId);
    const ydoc = new Y.Doc();
    Y.applyUpdate(ydoc, ydocUpdate);
    const map = ydoc.getMap('object');
    map.set('metaTypeId', metaTypeId);
    map.set('fields', new Y.Map());
    const syncedUpdate = Y.encodeStateAsUpdate(ydoc);

    await database
      .insertInto('nodes')
      .values({
        id: pageId,
        root_id: spaceId,
        attributes: JSON.stringify(sqliteAttributes),
        created_at: now,
        created_by: userId,
        local_revision: '0',
        server_revision: '0',
      })
      .execute();

    await database
      .insertInto('node_updates')
      .values({
        id: generateId(IdType.Update),
        node_id: pageId,
        data: syncedUpdate,
        created_at: now,
      })
      .execute();

    const result = await nodeService.updateNode(pageId, (draft) => {
      if (draft.type !== 'page') {
        return draft;
      }

      return {
        ...draft,
        metaTypeId,
        fields: draft.fields ?? {},
      };
    });

    expect(result).toBe('success');

    const row = await database
      .selectFrom('nodes')
      .where('id', '=', pageId)
      .selectAll()
      .executeTakeFirstOrThrow();

    const attributes = JSON.parse(row.attributes) as PageAttributes;
    expect(attributes.metaTypeId).toBe(metaTypeId);
    expect(row.meta_type_id).toBe(metaTypeId);

    const updateCount = await database
      .selectFrom('node_updates')
      .where('node_id', '=', pageId)
      .select(({ fn }) => fn.countAll().as('count'))
      .executeTakeFirstOrThrow();

    expect(Number(updateCount.count)).toBe(1);
  });

  it('creates a syncable node update when backfilling metaTypeId', async () => {
    const spaceId = generateId(IdType.Space);
    const pageId = generateId(IdType.Page);
    const metaTypeId = generateId(IdType.Database);
    const now = new Date().toISOString();

    await database
      .insertInto('nodes')
      .values({
        id: spaceId,
        root_id: spaceId,
        attributes: JSON.stringify({
          type: 'space',
          name: 'Main',
          description: '',
          collaborators: { [userId]: 'admin' },
          visibility: 'private',
        }),
        created_at: now,
        created_by: userId,
        local_revision: '0',
        server_revision: '0',
      })
      .execute();

    const sqliteAttributes = {
      type: 'page',
      name: 'Legacy',
      parentId: spaceId,
      fields: {},
    };

    await database
      .insertInto('nodes')
      .values({
        id: pageId,
        root_id: spaceId,
        attributes: JSON.stringify(sqliteAttributes),
        created_at: now,
        created_by: userId,
        local_revision: '0',
        server_revision: '0',
      })
      .execute();

    await database
      .insertInto('node_updates')
      .values({
        id: generateId(IdType.Update),
        node_id: pageId,
        data: buildLegacyPageYdocUpdate('Legacy', spaceId),
        created_at: now,
      })
      .execute();

    const result = await nodeService.updateNode(pageId, (draft) => {
      if (draft.type !== 'page') {
        return draft;
      }

      draft.metaTypeId = metaTypeId;
      draft.fields = draft.fields ?? {};
      return draft;
    });

    expect(result).toBe('success');

    const row = await database
      .selectFrom('nodes')
      .where('id', '=', pageId)
      .selectAll()
      .executeTakeFirstOrThrow();

    const attributes = JSON.parse(row.attributes) as PageAttributes;
    expect(attributes.metaTypeId).toBe(metaTypeId);

    const updates = await database
      .selectFrom('node_updates')
      .where('node_id', '=', pageId)
      .selectAll()
      .execute();

    expect(updates).toHaveLength(2);
  });
});
