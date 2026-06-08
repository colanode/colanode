/**
 * Opt-in demo that drives a real export/import round-trip between two fake
 * devices sharing one local-folder storage backend, then leaves the artifacts
 * on disk so you can browse them in Finder.
 *
 *   SYNC_DEMO_PATH=/Users/you/colapp-test/shared/sync \
 *     npx vitest run --config packages/client/vitest.config.ts \
 *     packages/client/test/dev/sync-demo.test.ts
 *
 * Without SYNC_DEMO_PATH the test is skipped (so it never breaks regular CI).
 */

import fs from 'node:fs';
import path from 'node:path';

import { Kysely } from 'kysely';
import { describe, expect, it } from 'vitest';

import type { WorkspaceDatabaseSchema } from '@colanode/client/databases';
import type { LocalSyncConfig } from '@colanode/client/services/app-meta';
import { CloudSyncService } from '@colanode/client/services/workspaces/cloud-sync-service';
import { DocumentService } from '@colanode/client/services/workspaces/document-service';
import { NodeCountersService } from '@colanode/client/services/workspaces/node-counters-service';
import { NodeReactionService } from '@colanode/client/services/workspaces/node-reaction-service';
import { NodeService } from '@colanode/client/services/workspaces/node-service';
import type { WorkspaceService } from '@colanode/client/services/workspaces/workspace-service';
import {
    generateId,
    getNodeModel,
    IdType,
    type NodeAttributes,
} from '@colanode/core';
import { YDoc } from '@colanode/crdt';

import { createWorkspaceDatabase } from '../helpers/sqlite';

const sharedSync = process.env.SYNC_DEMO_PATH;

const workspaceId = generateId(IdType.Workspace);
const userId = generateId(IdType.User);
const accountId = generateId(IdType.Account);

interface Device {
    label: string;
    deviceId: string;
    database: Kysely<WorkspaceDatabaseSchema>;
    cloudSync: CloudSyncService;
}

const buildDevice = async (
    label: string,
    deviceId: string,
    storagePath: string
): Promise<Device> => {
    const database = await createWorkspaceDatabase();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const workspace: any = {
        workspaceId,
        userId,
        accountId,
        database,
        account: { app: { meta: { localOnly: true } } },
        files: { deleteFile: async () => { } },
        workspace: { name: 'Sync Demo' },
    };
    workspace.nodeCounters = new NodeCountersService(workspace);
    workspace.nodes = new NodeService(workspace);
    workspace.documents = new DocumentService(workspace);
    workspace.nodeReactions = new NodeReactionService(workspace);

    const config: LocalSyncConfig = {
        deviceId,
        storage: { type: 'local', path: storagePath },
    };
    const cloudSync = new CloudSyncService(workspace as WorkspaceService, config);
    return { label, deviceId, database, cloudSync };
};

const seedNode = async (
    device: Device,
    attributes: NodeAttributes,
    rootId: string
): Promise<string> => {
    const nodeId = generateId(IdType.Page);
    const now = new Date().toISOString();
    const model = getNodeModel(attributes.type);
    const ydoc = new YDoc();
    const update = ydoc.update(model.attributesSchema, attributes);
    if (!update) throw new Error('failed to build update');

    await device.database
        .insertInto('nodes')
        .values({
            id: nodeId,
            root_id: rootId,
            attributes: JSON.stringify(attributes),
            created_at: now,
            created_by: userId,
            local_revision: '0',
            server_revision: '0',
        })
        .execute();

    await device.database
        .insertInto('node_updates')
        .values({
            id: generateId(IdType.Update),
            node_id: nodeId,
            data: update,
            created_at: now,
        })
        .execute();

    return nodeId;
};

const countNodes = async (device: Device) =>
    Number(
        (
            await device.database
                .selectFrom('nodes')
                .select((eb) => eb.fn.countAll<number>().as('c'))
                .executeTakeFirstOrThrow()
        ).c
    );

describe.skipIf(!sharedSync)('sync demo (writes to SYNC_DEMO_PATH)', () => {
    it('exports/imports a multi-round conversation between two devices', async () => {
        const target = sharedSync as string;
        fs.mkdirSync(target, { recursive: true });

        // eslint-disable-next-line no-console
        console.log(`\n[demo] shared sync directory: ${target}`);
        // eslint-disable-next-line no-console
        console.log(`[demo] workspaceId=${workspaceId} userId=${userId}`);

        const a = await buildDevice('A', generateId(IdType.Device), target);
        const b = await buildDevice('B', generateId(IdType.Device), target);

        // eslint-disable-next-line no-console
        console.log(`[demo] device A=${a.deviceId}`);
        // eslint-disable-next-line no-console
        console.log(`[demo] device B=${b.deviceId}`);

        const spaceId = generateId(IdType.Space);

        // Round 1: A writes two pages, B should see both.
        await seedNode(a, { type: 'page', name: 'Roadmap', parentId: spaceId }, spaceId);
        await seedNode(a, { type: 'page', name: 'Ideas', parentId: spaceId }, spaceId);
        await a.cloudSync.exportLocal();
        await b.cloudSync.importRemote();
        expect(await countNodes(b)).toBe(2);

        // Round 2: B writes one page, A should pick it up.
        await seedNode(b, { type: 'page', name: 'Notes from B', parentId: spaceId }, spaceId);
        await b.cloudSync.exportLocal();
        await a.cloudSync.importRemote();
        expect(await countNodes(a)).toBe(3);

        // Round 3: A re-imports — should be a no-op (idempotent).
        await a.cloudSync.importRemote();
        expect(await countNodes(a)).toBe(3);

        // eslint-disable-next-line no-console
        console.log(`[demo] done. inspect ${path.join(target, 'workspaces')}`);

        a.cloudSync.destroy();
        b.cloudSync.destroy();
        await a.database.destroy();
        await b.database.destroy();
    });
});
