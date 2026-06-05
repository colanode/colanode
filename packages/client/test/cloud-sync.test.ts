import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { Kysely } from 'kysely';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';


import type { WorkspaceDatabaseSchema } from '@colanode/client/databases';
import type { LocalSyncConfig } from '@colanode/client/services/app-meta';
import { LocalStorageProvider } from '@colanode/client/services/backup';
import { CloudSyncService } from '@colanode/client/services/workspaces/cloud-sync-service';
import { DocumentService } from '@colanode/client/services/workspaces/document-service';
import { NodeCountersService } from '@colanode/client/services/workspaces/node-counters-service';
import { NodeReactionService } from '@colanode/client/services/workspaces/node-reaction-service';
import { NodeService } from '@colanode/client/services/workspaces/node-service';
import { acquireWorkspaceIdentity, readWorkspaceManifest, writeWorkspaceManifest } from '@colanode/client/services/workspaces/workspace-manifest';
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
    workspaceId: string;
    userId: string;
}

const workspaceId = generateId(IdType.Workspace);
const userId = generateId(IdType.User);
const accountId = generateId(IdType.Account);

const createDeviceWithIds = async (
    deviceId: string,
    storagePath: string,
    ids: { workspaceId: string; userId: string; accountId: string }
): Promise<Device> => {
    const database = await createWorkspaceDatabase();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const workspace: any = {
        workspaceId: ids.workspaceId,
        userId: ids.userId,
        accountId: ids.accountId,
        database,
        account: { app: { meta: { localOnly: true } } },
        files: { deleteFile: async () => { } },
        // The cloud-sync service reads workspace.workspace.name when seeding
        // the shared manifest for the first time; provide a placeholder.
        workspace: { name: 'Test Workspace' },
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

    return {
        database,
        workspace: workspace as WorkspaceService,
        cloudSync,
        workspaceId: ids.workspaceId,
        userId: ids.userId,
    };
};

const createDevice = (
    deviceId: string,
    storagePath: string
): Promise<Device> =>
    createDeviceWithIds(deviceId, storagePath, {
        workspaceId,
        userId,
        accountId,
    });

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
            created_by: device.userId,
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

    it('tracks export/import timestamps in the published status', async () => {
        const spaceId = generateId(IdType.Space);
        await seedNode(
            deviceA,
            { type: 'page', name: 'Status Probe', parentId: spaceId },
            spaceId
        );

        const baseline = deviceA.cloudSync.getStatus();
        expect(baseline.enabled).toBe(true);
        expect(baseline.lastExportAt).toBeNull();
        expect(baseline.lastImportAt).toBeNull();

        await deviceA.cloudSync.exportLocal();
        await deviceB.cloudSync.importRemote();

        const afterA = deviceA.cloudSync.getStatus();
        const afterB = deviceB.cloudSync.getStatus();

        expect(afterA.lastExportAt).not.toBeNull();
        expect(afterA.lastExportError).toBeNull();
        expect(afterB.lastImportAt).not.toBeNull();
        expect(afterB.lastImportError).toBeNull();
        expect(afterA.isRunning).toBe(false);
        expect(afterB.isRunning).toBe(false);
    });

    it('replays a reaction create from device A to device B', async () => {
        const spaceId = generateId(IdType.Space);
        const { nodeId } = await seedNode(
            deviceA,
            { type: 'page', name: 'Reactable', parentId: spaceId },
            spaceId
        );

        const updateId = generateId(IdType.Update);
        const now = new Date().toISOString();
        const reactionData = {
            nodeId,
            collaboratorId: deviceA.userId,
            reaction: ':+1:',
            rootId: spaceId,
            workspaceId: deviceA.workspaceId,
            revision: updateId,
            createdAt: now,
            deletedAt: null,
        };

        await deviceA.database
            .insertInto('node_reactions')
            .values({
                node_id: nodeId,
                collaborator_id: deviceA.userId,
                reaction: ':+1:',
                root_id: spaceId,
                revision: '0',
                created_at: now,
            })
            .execute();

        await deviceA.database
            .insertInto('node_reaction_updates')
            .values({
                id: updateId,
                node_id: nodeId,
                collaborator_id: deviceA.userId,
                reaction: ':+1:',
                root_id: spaceId,
                data: JSON.stringify(reactionData),
                created_at: now,
            })
            .execute();

        await deviceA.cloudSync.exportLocal();
        await deviceB.cloudSync.importRemote();

        const reaction = await deviceB.database
            .selectFrom('node_reactions')
            .selectAll()
            .where('node_id', '=', nodeId)
            .where('collaborator_id', '=', deviceA.userId)
            .where('reaction', '=', ':+1:')
            .executeTakeFirst();

        expect(reaction).toBeTruthy();
        expect(reaction!.revision).toBe(updateId);

        const cursor = await deviceA.database
            .selectFrom('sync_state')
            .selectAll()
            .where('key', '=', 'export.node_reactions')
            .executeTakeFirst();
        expect(cursor?.value).toBe(updateId);
    });

    it('replays a reaction delete with last-writer-wins ordering', async () => {
        const spaceId = generateId(IdType.Space);
        const { nodeId } = await seedNode(
            deviceA,
            { type: 'page', name: 'Unreactable', parentId: spaceId },
            spaceId
        );

        const createId = generateId(IdType.Update);
        const createdAt = new Date().toISOString();
        await deviceA.database
            .insertInto('node_reactions')
            .values({
                node_id: nodeId,
                collaborator_id: deviceA.userId,
                reaction: ':tada:',
                root_id: spaceId,
                revision: '0',
                created_at: createdAt,
            })
            .execute();
        await deviceA.database
            .insertInto('node_reaction_updates')
            .values({
                id: createId,
                node_id: nodeId,
                collaborator_id: deviceA.userId,
                reaction: ':tada:',
                root_id: spaceId,
                data: JSON.stringify({
                    nodeId,
                    collaboratorId: deviceA.userId,
                    reaction: ':tada:',
                    rootId: spaceId,
                    workspaceId: deviceA.workspaceId,
                    revision: createId,
                    createdAt,
                    deletedAt: null,
                }),
                created_at: createdAt,
            })
            .execute();

        // Delete after a short delay so the ULID is strictly later than create.
        const deleteId = generateId(IdType.Update);
        const deletedAt = new Date().toISOString();
        await deviceA.database
            .deleteFrom('node_reactions')
            .where('node_id', '=', nodeId)
            .where('collaborator_id', '=', deviceA.userId)
            .where('reaction', '=', ':tada:')
            .execute();
        await deviceA.database
            .insertInto('node_reaction_updates')
            .values({
                id: deleteId,
                node_id: nodeId,
                collaborator_id: deviceA.userId,
                reaction: ':tada:',
                root_id: spaceId,
                data: JSON.stringify({
                    nodeId,
                    collaboratorId: deviceA.userId,
                    reaction: ':tada:',
                    rootId: spaceId,
                    workspaceId: deviceA.workspaceId,
                    revision: deleteId,
                    createdAt,
                    deletedAt,
                }),
                created_at: deletedAt,
            })
            .execute();

        await deviceA.cloudSync.exportLocal();
        await deviceB.cloudSync.importRemote();

        const reaction = await deviceB.database
            .selectFrom('node_reactions')
            .selectAll()
            .where('node_id', '=', nodeId)
            .where('reaction', '=', ':tada:')
            .executeTakeFirst();
        expect(reaction).toBeUndefined();

        const cursor = await deviceA.database
            .selectFrom('sync_state')
            .selectAll()
            .where('key', '=', 'export.node_reactions')
            .executeTakeFirst();
        expect(cursor?.value).toBe(deleteId);
    });

    it('uploads and downloads file bytes between devices', async () => {
        const fileId = generateId(IdType.File);
        const bytes = new Uint8Array([1, 2, 3, 4, 5]);

        await deviceA.cloudSync.uploadFile(fileId, '.bin', bytes);

        const fetched = await deviceB.cloudSync.downloadFile(fileId, '.bin');
        expect(fetched).not.toBeNull();
        expect(Array.from(fetched!)).toEqual(Array.from(bytes));

        const missing = await deviceB.cloudSync.downloadFile(
            generateId(IdType.File),
            '.bin'
        );
        expect(missing).toBeNull();
    });

    it('uploads completed local files during exportLocal and advances the cursor', async () => {
        const fileId = generateId(IdType.File);
        const spaceId = generateId(IdType.Space);
        const bytes = new Uint8Array([10, 20, 30, 40]);
        const localPath = `/virtual/${fileId}.bin`;

        // Stub the filesystem read used by exportFiles.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (deviceA.workspace.account.app as any).fs = {
            readFile: async (p: string) => {
                if (p !== localPath) {
                    throw new Error(`Unexpected read ${p}`);
                }
                return bytes;
            },
        };

        const now = new Date().toISOString();
        await deviceA.database
            .insertInto('nodes')
            .values({
                id: fileId,
                root_id: spaceId,
                attributes: JSON.stringify({
                    type: 'file',
                    subtype: 'other',
                    parentId: spaceId,
                    name: 'note.bin',
                    originalName: 'note.bin',
                    mimeType: 'application/octet-stream',
                    extension: '.bin',
                    size: bytes.length,
                    version: generateId(IdType.Version),
                    status: 0,
                }),
                created_at: now,
                created_by: deviceA.userId,
                local_revision: '0',
                server_revision: '0',
            })
            .execute();

        await deviceA.database
            .insertInto('local_files')
            .values({
                id: fileId,
                version: generateId(IdType.Version),
                path: localPath,
                created_at: now,
                opened_at: now,
                download_status: 2,
                download_progress: 100,
                download_retries: 0,
                download_completed_at: now,
            })
            .execute();

        await deviceA.cloudSync.exportLocal();

        const fetched = await deviceB.cloudSync.downloadFile(fileId, '.bin');
        expect(fetched).not.toBeNull();
        expect(Array.from(fetched!)).toEqual(Array.from(bytes));

        const cursor = await deviceA.database
            .selectFrom('sync_state')
            .selectAll()
            .where('key', '=', 'export.files')
            .executeTakeFirst();
        expect(cursor?.value).toBe(fileId);

        // A second export with no new files must remain a no-op.
        await deviceA.cloudSync.exportLocal();
        const cursorAfter = await deviceA.database
            .selectFrom('sync_state')
            .selectAll()
            .where('key', '=', 'export.files')
            .executeTakeFirst();
        expect(cursorAfter?.value).toBe(fileId);
    });
});

// End-to-end Stage-2 join flow: device A boots into an empty storage and
// publishes its identity through the manifest; device B starts with no local
// workspace, reads the manifest, adopts the same workspaceId/userId, and
// replays the full op-log to materialize the same data.
describe('CloudSyncService (manifest-based join flow)', () => {
    let tempDir: string;
    let storagePath: string;

    beforeEach(async () => {
        tempDir = await fs.promises.mkdtemp(
            path.join(os.tmpdir(), 'cloud-sync-join-')
        );
        storagePath = path.join(tempDir, 'storage');
    });

    afterEach(async () => {
        await fs.promises.rm(tempDir, { recursive: true, force: true });
    });

    const bootDevice = async (deviceId: string): Promise<Device> => {
        const provider = new LocalStorageProvider({
            type: 'local',
            path: storagePath,
        });
        await provider.init();
        const manifest = await acquireWorkspaceIdentity(provider, deviceId, () => ({
            workspaceId: generateId(IdType.Workspace),
            userId: generateId(IdType.User),
            name: 'My Workspace',
        }));
        return createDeviceWithIds(deviceId, storagePath, {
            workspaceId: manifest.workspaceId,
            userId: manifest.userId,
            accountId: generateId(IdType.Account),
        });
    };

    it('device B adopts device A\u2019s identity and replays the full op-log', async () => {
        const deviceA = await bootDevice(generateId(IdType.Device));

        const spaceId = generateId(IdType.Space);
        const { nodeId: pageA } = await seedNode(
            deviceA,
            { type: 'page', name: 'Roadmap', parentId: spaceId },
            spaceId
        );
        const { nodeId: pageB } = await seedNode(
            deviceA,
            { type: 'page', name: 'Backlog', parentId: spaceId },
            spaceId
        );

        await deviceA.cloudSync.exportLocal();

        const deviceB = await bootDevice(generateId(IdType.Device));

        try {
            expect(deviceB.workspaceId).toBe(deviceA.workspaceId);
            expect(deviceB.userId).toBe(deviceA.userId);

            await deviceB.cloudSync.importRemote();

            for (const nodeId of [pageA, pageB]) {
                const node = await deviceB.database
                    .selectFrom('nodes')
                    .selectAll()
                    .where('id', '=', nodeId)
                    .executeTakeFirst();
                expect(node).toBeTruthy();
                expect(node!.created_by).toBe(deviceA.userId);
            }

            const allNodes = await deviceB.database
                .selectFrom('nodes')
                .selectAll()
                .execute();
            expect(allNodes).toHaveLength(2);
        } finally {
            deviceA.cloudSync.destroy();
            deviceB.cloudSync.destroy();
            await deviceA.database.destroy();
            await deviceB.database.destroy();
        }
    });
});

// Stage 3.4: a device whose local workspace identity disagrees with the shared
// manifest must refuse to sync, surfacing the drift through the published
// status so the UI can warn the user instead of corrupting peer data.
describe('CloudSyncService (identity drift)', () => {
    let tempDir: string;
    let storagePath: string;

    beforeEach(async () => {
        tempDir = await fs.promises.mkdtemp(
            path.join(os.tmpdir(), 'cloud-sync-drift-')
        );
        storagePath = path.join(tempDir, 'storage');
    });

    afterEach(async () => {
        await fs.promises.rm(tempDir, { recursive: true, force: true });
    });

    it('seeds the manifest with the local identity on first connect', async () => {
        const deviceId = generateId(IdType.Device);
        const device = await createDeviceWithIds(deviceId, storagePath, {
            workspaceId: generateId(IdType.Workspace),
            userId: generateId(IdType.User),
            accountId: generateId(IdType.Account),
        });

        try {
            await device.cloudSync.exportLocal();

            const provider = new LocalStorageProvider({
                type: 'local',
                path: storagePath,
            });
            await provider.init();

            const manifest = await readWorkspaceManifest(provider);
            expect(manifest).toBeTruthy();
            expect(manifest!.workspaceId).toBe(device.workspaceId);
            expect(manifest!.userId).toBe(device.userId);
            expect(manifest!.createdByDeviceId).toBe(deviceId);

            const status = device.cloudSync.getStatus();
            expect(status.enabled).toBe(true);
            expect(status.identityDrift).toBeNull();
        } finally {
            device.cloudSync.destroy();
            await device.database.destroy();
        }
    });

    it('disables sync and reports drift when the manifest already belongs to a different workspace', async () => {
        // Pre-seed the shared manifest with someone else's identity.
        const provider = new LocalStorageProvider({
            type: 'local',
            path: storagePath,
        });
        await provider.init();
        const foreignWorkspaceId = generateId(IdType.Workspace);
        const foreignUserId = generateId(IdType.User);
        const foreignDeviceId = generateId(IdType.Device);
        await writeWorkspaceManifest(provider, {
            workspaceId: foreignWorkspaceId,
            userId: foreignUserId,
            name: 'Foreign Workspace',
            createdAt: new Date().toISOString(),
            createdByDeviceId: foreignDeviceId,
        });

        const localWorkspaceId = generateId(IdType.Workspace);
        const localUserId = generateId(IdType.User);
        const device = await createDeviceWithIds(
            generateId(IdType.Device),
            storagePath,
            {
                workspaceId: localWorkspaceId,
                userId: localUserId,
                accountId: generateId(IdType.Account),
            }
        );

        try {
            // Seed something exportable so an attempted sync would otherwise
            // produce a log file under the foreign manifest's namespace.
            const spaceId = generateId(IdType.Space);
            await seedNode(
                device,
                { type: 'page', name: 'Should not ship', parentId: spaceId },
                spaceId
            );

            await device.cloudSync.exportLocal();

            const status = device.cloudSync.getStatus();
            expect(status.enabled).toBe(false);
            expect(status.identityDrift).not.toBeNull();
            expect(status.identityDrift!.localWorkspaceId).toBe(localWorkspaceId);
            expect(status.identityDrift!.localUserId).toBe(localUserId);
            expect(status.identityDrift!.manifestWorkspaceId).toBe(
                foreignWorkspaceId
            );
            expect(status.identityDrift!.manifestUserId).toBe(foreignUserId);
            expect(status.identityDrift!.manifestCreatedByDeviceId).toBe(
                foreignDeviceId
            );

            // No device-specific log directory may have been created.
            const deviceLogs = await fs.promises
                .readdir(
                    path.join(
                        storagePath,
                        'workspaces',
                        localWorkspaceId,
                        'devices'
                    )
                )
                .catch(() => [] as string[]);
            expect(deviceLogs).toHaveLength(0);

            // Subsequent calls remain a no-op while drift persists.
            await device.cloudSync.importRemote();
            const statusAfter = device.cloudSync.getStatus();
            expect(statusAfter.enabled).toBe(false);
            expect(statusAfter.identityDrift).not.toBeNull();
        } finally {
            device.cloudSync.destroy();
            await device.database.destroy();
        }
    });
});
