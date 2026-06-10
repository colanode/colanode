import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Kysely } from 'kysely';

import {
  WorkspaceDatabaseSchema,
} from '@colanode/client/databases';
import { PageByMetaTypeQueryHandler } from '@colanode/client/handlers/queries/pages/page-by-meta-type';
import {
  ensurePageMetaTypes,
  findDefaultPageMetaTypeId,
} from '@colanode/client/lib/page-meta-types';
import { WorkspaceService } from '@colanode/client/services/workspaces/workspace-service';
import {
  DEFAULT_PAGE_META_TYPE_NAME,
  generateId,
  IdType,
  PageAttributes,
  UserStatus,
} from '@colanode/core';

import { ensureNodesMetaTypeIdColumn } from '@colanode/client/databases/workspace/migrations/meta-type-id-column';

import { createWorkspaceDatabase, createWorkspaceDatabaseUpTo } from './helpers/sqlite';

const insertNode = async (
  database: Kysely<WorkspaceDatabaseSchema>,
  id: string,
  attributes: Record<string, unknown>,
  createdBy: string
) => {
  const parentId =
    typeof attributes.parentId === 'string' ? attributes.parentId : id;

  await database
    .insertInto('nodes')
    .values({
      id,
      root_id: parentId,
      attributes: JSON.stringify(attributes),
      created_at: new Date().toISOString(),
      created_by: createdBy,
      local_revision: '0',
      server_revision: '0',
    })
    .execute();
};

describe('meta_type_id migration', () => {
  it('adds a virtual meta_type_id column to existing nodes tables', async () => {
    const database = await createWorkspaceDatabaseUpTo(
      '00024-create-node-reaction-updates-table'
    );
    const metaTypeId = generateId(IdType.Database);
    const pageId = generateId(IdType.Page);

    await insertNode(
      database,
      pageId,
      {
        type: 'page',
        name: 'Legacy',
        parentId: generateId(IdType.Space),
        metaTypeId,
        fields: {},
      },
      generateId(IdType.User)
    );

    await ensureNodesMetaTypeIdColumn(database);

    const row = await database
      .selectFrom('nodes')
      .where('id', '=', pageId)
      .selectAll()
      .executeTakeFirstOrThrow();

    expect(row.meta_type_id).toBe(metaTypeId);
    await database.destroy();
  });
});

describe('page meta types', () => {
  let database: Kysely<WorkspaceDatabaseSchema>;
  const userId = generateId(IdType.User);

  beforeEach(async () => {
    database = await createWorkspaceDatabase();
    await database
      .insertInto('users')
      .values({
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
        status: UserStatus.Active,
        revision: '1',
        created_at: new Date().toISOString(),
        updated_at: null,
        avatar: null,
        custom_name: null,
        custom_avatar: null,
      })
      .execute();
  });

  afterEach(async () => {
    await database.destroy();
  });

  it('queries pages by meta_type_id index', async () => {
    const spaceId = generateId(IdType.Space);
    const metaTypeId = generateId(IdType.Database);
    const pageWithMeta = generateId(IdType.Page);
    const pageOtherMeta = generateId(IdType.Page);
    const otherMetaTypeId = generateId(IdType.Database);

    await insertNode(
      database,
      spaceId,
      {
        type: 'space',
        name: 'Main',
        description: '',
        collaborators: { [userId]: 'admin' },
        visibility: 'private',
      },
      userId
    );

    await insertNode(
      database,
      metaTypeId,
      {
        type: 'database',
        name: DEFAULT_PAGE_META_TYPE_NAME,
        parentId: spaceId,
        purpose: 'meta_type',
        fields: {},
      },
      userId
    );

    await insertNode(
      database,
      otherMetaTypeId,
      {
        type: 'database',
        name: 'Other',
        parentId: spaceId,
        purpose: 'meta_type',
        fields: {},
      },
      userId
    );

    await insertNode(
      database,
      pageWithMeta,
      {
        type: 'page',
        name: 'Listed',
        parentId: spaceId,
        metaTypeId,
        fields: {},
      },
      userId
    );

    await insertNode(
      database,
      pageOtherMeta,
      {
        type: 'page',
        name: 'Other',
        parentId: spaceId,
        metaTypeId: otherMetaTypeId,
        fields: {},
      },
      userId
    );

    const rows = await database
      .selectFrom('nodes')
      .where('type', '=', 'page')
      .where('meta_type_id', '=', metaTypeId)
      .selectAll()
      .execute();

    expect(rows.map((row) => row.id)).toEqual([pageWithMeta]);
  });

  it('backfills missing metaTypeId on existing pages', async () => {
    const spaceId = generateId(IdType.Space);
    const pageId = generateId(IdType.Page);

    await insertNode(
      database,
      spaceId,
      {
        type: 'space',
        name: 'Main',
        description: '',
        collaborators: { [userId]: 'admin' },
        visibility: 'private',
      },
      userId
    );

    await insertNode(
      database,
      pageId,
      {
        type: 'page',
        name: 'Legacy',
        parentId: spaceId,
        fields: {},
      } as PageAttributes,
      userId
    );

    const workspace = {
      userId,
      workspaceId: generateId(IdType.Workspace),
      accountId: generateId(IdType.Account),
      database,
      nodes: {
        insertNode: async (id: string, attributes: Record<string, unknown>) => {
          await insertNode(database, id, attributes, userId);
        },
        updateNode: vi.fn().mockResolvedValue('success'),
      },
    } as unknown as WorkspaceService;

    await ensurePageMetaTypes(workspace);

    const defaultMetaTypeId = await findDefaultPageMetaTypeId(workspace);
    expect(defaultMetaTypeId).not.toBeNull();

    const pageRow = await database
      .selectFrom('nodes')
      .where('id', '=', pageId)
      .selectAll()
      .executeTakeFirstOrThrow();

    const attributes = JSON.parse(pageRow.attributes) as PageAttributes;
    expect(attributes.metaTypeId).toBe(defaultMetaTypeId);
    expect(pageRow.meta_type_id).toBe(defaultMetaTypeId);
  });

  it('PageByMetaTypeQueryHandler returns pages for a meta type', async () => {
    const spaceId = generateId(IdType.Space);
    const metaTypeId = generateId(IdType.Database);
    const pageId = generateId(IdType.Page);

    await insertNode(
      database,
      spaceId,
      {
        type: 'space',
        name: 'Main',
        description: '',
        collaborators: { [userId]: 'admin' },
        visibility: 'private',
      },
      userId
    );

    await insertNode(
      database,
      metaTypeId,
      {
        type: 'database',
        name: 'Docs',
        parentId: spaceId,
        purpose: 'meta_type',
        fields: {},
      },
      userId
    );

    await insertNode(
      database,
      pageId,
      {
        type: 'page',
        name: 'Doc',
        parentId: spaceId,
        metaTypeId,
        fields: {},
      },
      userId
    );

    const handler = new PageByMetaTypeQueryHandler({
      getWorkspace: () =>
        ({
          userId,
          database,
        }) as WorkspaceService,
    } as never);

    const pages = await handler.handleQuery({
      type: 'page.byMetaType',
      userId,
      metaTypeId,
    });

    expect(pages).toHaveLength(1);
    expect(pages[0]?.id).toBe(pageId);
    expect(pages[0]?.metaTypeId).toBe(metaTypeId);
  });
});
