import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { Kysely } from 'kysely';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';


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

import { createWorkspaceDatabase } from './helpers/sqlite';

// These tests exercise the pure-local (LOCAL_ONLY) multi-device sync pipeline:
// device A appends to its op-log, ships it through a shared local-folder storage
// provider, and device B replays it into its own local store. Both devices share
// the SAME workspaceId/userId (simulating an already-unified identity) and use
// DIFFERENT deviceIds, so each writes to its own immutable log prefix.

interface Device {
    database: Kysely<WorkspaceDatabaseSchema>;
    workspace: WorkspaceService;
    cloudSync: CloudSyncService;
}

const workspaceId = generateId(IdType.Workspace);
const userId = generateId(IdType.User);
const accountId = generateId(IdType.Account);

const createDevice = async (
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

    return { database, workspace: workspace as WorkspaceService, cloudSync };
};

const seedNode = async (
    device: Device,
    attributes: NodeAttributes,
    rootId: string
): Promise<{ nodeId: string; update: Uint8Array }> => {
    const nodeId = generateId(IdType.Page);
    const now = new Date().toISOString();

    const model = getNodeModel(attributes.type);
    const ydoc = new YDoc();
    const update = ydoc.update(model.attributesSchema, attributes);
    if (!update) {
        throw new Error('Failed to generate node update');
    }

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

    return { nodeId, update };
};

describe('CloudSyncService (local-folder peer sync)', () => {
    let tempDir: string;
    let storagePath: string;
    let deviceA: Device;
    let deviceB: Device;

    beforeEach(async () => {
        tempDir = await fs.promises.mkdtemp(
            path.join(os.tmpdir(), 'cloud-sync-test-')
        );
        storagePath = path.join(tempDir, 'storage');

        deviceA = await createDevice(generateId(IdType.Device), storagePath);
        deviceB = await createDevice(generateId(IdType.Device), storagePath);
    });

    afterEach(async () => {
        deviceA.cloudSync.destroy();
        deviceB.cloudSync.destroy();
        await deviceA.database.destroy();
        await deviceB.database.destroy();
        await fs.promises.rm(tempDir, { recursive: true, force: true });
    });

    it('replays a created node from device A to device B', async () => {
        const spaceId = generateId(IdType.Space);
        const { nodeId } = await seedNode(
            deviceA,
            { type: 'page', name: 'Roadmap', parentId: spaceId },
            spaceId
        );

        await deviceA.cloudSync.exportLocal();
        await deviceB.cloudSync.importRemote();

        const node = await deviceB.database
            .selectFrom('nodes')
            .selectAll()
            .where('id', '=', nodeId)
            .executeTakeFirst();

        expect(node).toBeTruthy();
        expect(node!.type).toBe('page');
        expect(node!.root_id).toBe(spaceId);
        expect(JSON.parse(node!.attributes).name).toBe('Roadmap');

        const updates = await deviceB.database
            .selectFrom('node_updates')
            .selectAll()
            .where('node_id', '=', nodeId)
            .execute();
        expect(updates).toHaveLength(1);

        const text = await deviceB.database
            .selectFrom('node_texts')
            .selectAll()
            .where('id', '=', nodeId)
            .executeTakeFirst();
        expect(text?.name).toBe('Roadmap');
    });

    it('is idempotent and ignores a device\u2019s own log', async () => {
        const spaceId = generateId(IdType.Space);
        const { nodeId } = await seedNode(
            deviceA,
            { type: 'page', name: 'Notes', parentId: spaceId },
            spaceId
        );

        await deviceA.cloudSync.exportLocal();

        // Device A must not re-import the file it produced.
        await deviceA.cloudSync.importRemote();

        // Device B imports twice; the second pass must be a no-op.
        await deviceB.cloudSync.importRemote();
        await deviceB.cloudSync.importRemote();

        const updates = await deviceB.database
            .selectFrom('node_updates')
            .selectAll()
            .where('node_id', '=', nodeId)
            .execute();
        expect(updates).toHaveLength(1);

        const nodes = await deviceB.database
            .selectFrom('nodes')
            .selectAll()
            .where('id', '=', nodeId)
            .execute();
        expect(nodes).toHaveLength(1);
    });

    it('converges a subsequent update from device A onto device B', async () => {
        const spaceId = generateId(IdType.Space);
        const attributes: NodeAttributes = {
            type: 'page',
            name: 'Plan',
            parentId: spaceId,
        };
        const { nodeId, update } = await seedNode(deviceA, attributes, spaceId);

        await deviceA.cloudSync.exportLocal();
        await deviceB.cloudSync.importRemote();

        // Produce a second op against the same node and ship it.
        const ydoc = new YDoc(update);
        const model = getNodeModel('page');
        const update2 = ydoc.update(model.attributesSchema, {
            ...attributes,
            name: 'Plan v2',
        });
        if (!update2) {
            throw new Error('Failed to generate second node update');
        }

        await deviceA.database
            .insertInto('node_updates')
            .values({
                id: generateId(IdType.Update),
                node_id: nodeId,
                data: update2,
                created_at: new Date().toISOString(),
            })
            .execute();

        await deviceA.cloudSync.exportLocal();
        await deviceB.cloudSync.importRemote();

        const node = await deviceB.database
            .selectFrom('nodes')
            .selectAll()
            .where('id', '=', nodeId)
            .executeTakeFirst();

        expect(JSON.parse(node!.attributes).name).toBe('Plan v2');

        const updates = await deviceB.database
            .selectFrom('node_updates')
            .selectAll()
            .where('node_id', '=', nodeId)
            .execute();
        expect(updates).toHaveLength(2);
    });

    it('replays a deletion (tombstone) from device A to device B', async () => {
        const spaceId = generateId(IdType.Space);
        const { nodeId } = await seedNode(
            deviceA,
            { type: 'page', name: 'Temp', parentId: spaceId },
            spaceId
        );

        await deviceA.cloudSync.exportLocal();
        await deviceB.cloudSync.importRemote();

        expect(
            await deviceB.database
                .selectFrom('nodes')
                .selectAll()
                .where('id', '=', nodeId)
                .executeTakeFirst()
        ).toBeTruthy();

        // Delete on device A: drop the node and record a tombstone.
        await deviceA.database
            .insertInto('tombstones')
            .values({
                id: nodeId,
                data: JSON.stringify({ root_id: spaceId }),
                deleted_at: new Date().toISOString(),
            })
            .execute();
        await deviceA.database
            .deleteFrom('nodes')
            .where('id', '=', nodeId)
            .execute();

        await deviceA.cloudSync.exportLocal();
        await deviceB.cloudSync.importRemote();

        const node = await deviceB.database
            .selectFrom('nodes')
            .selectAll()
            .where('id', '=', nodeId)
            .executeTakeFirst();
        expect(node).toBeUndefined();

        const tombstone = await deviceB.database
            .selectFrom('tombstones')
            .selectAll()
            .where('id', '=', nodeId)
            .executeTakeFirst();
        expect(tombstone).toBeTruthy();
    });
});
