import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { LocalStorageProvider } from '@colanode/client/services/backup';
import {
    acquireWorkspaceIdentity,
    LEGACY_WORKSPACE_MANIFEST_KEY,
    migrateLegacyRootManifest,
    readLegacyRootManifest,
    readWorkspaceManifest,
    workspaceManifestKey,
    writeWorkspaceManifest,
} from '@colanode/client/services/workspaces/workspace-manifest';
import { generateId, IdType } from '@colanode/core';

describe('workspace-manifest', () => {
    let tempDir: string;
    let provider: LocalStorageProvider;

    beforeEach(async () => {
        tempDir = await fs.promises.mkdtemp(
            path.join(os.tmpdir(), 'manifest-test-')
        );
        provider = new LocalStorageProvider({ type: 'local', path: tempDir });
        await provider.init();
    });

    afterEach(async () => {
        await fs.promises.rm(tempDir, { recursive: true, force: true });
    });

    it('returns null when the manifest is absent', async () => {
        const workspaceId = generateId(IdType.Workspace);
        expect(await readWorkspaceManifest(provider, workspaceId)).toBeNull();
    });

    it('round-trips a manifest through the storage provider', async () => {
        const workspaceId = generateId(IdType.Workspace);
        const manifest = {
            workspaceId,
            userId: generateId(IdType.User),
            name: 'Local',
            createdAt: new Date().toISOString(),
            createdByDeviceId: generateId(IdType.Device),
        };

        await writeWorkspaceManifest(provider, manifest);

        const persisted = path.join(tempDir, workspaceManifestKey(workspaceId));
        expect(fs.existsSync(persisted)).toBe(true);

        const loaded = await readWorkspaceManifest(provider, workspaceId);
        expect(loaded).toEqual(manifest);
    });

    it('hosts multiple workspaces under the same storage root', async () => {
        const wsA = generateId(IdType.Workspace);
        const wsB = generateId(IdType.Workspace);

        const manifestA = {
            workspaceId: wsA,
            userId: generateId(IdType.User),
            name: 'Workspace A',
            createdAt: new Date().toISOString(),
            createdByDeviceId: generateId(IdType.Device),
        };
        const manifestB = {
            workspaceId: wsB,
            userId: generateId(IdType.User),
            name: 'Workspace B',
            createdAt: new Date().toISOString(),
            createdByDeviceId: generateId(IdType.Device),
        };

        await writeWorkspaceManifest(provider, manifestA);
        await writeWorkspaceManifest(provider, manifestB);

        expect(await readWorkspaceManifest(provider, wsA)).toEqual(manifestA);
        expect(await readWorkspaceManifest(provider, wsB)).toEqual(manifestB);
    });

    it('writes a fresh manifest on first acquire and reuses it on next acquire for the same workspace', async () => {
        const workspaceId = generateId(IdType.Workspace);
        const deviceA = generateId(IdType.Device);
        const deviceB = generateId(IdType.Device);

        let aFallbackCalls = 0;
        const aIdentity = await acquireWorkspaceIdentity(
            provider,
            workspaceId,
            deviceA,
            () => {
                aFallbackCalls += 1;
                return {
                    workspaceId,
                    userId: generateId(IdType.User),
                    name: 'My Workspace',
                };
            }
        );
        expect(aFallbackCalls).toBe(1);
        expect(aIdentity.createdByDeviceId).toBe(deviceA);

        let bFallbackCalls = 0;
        const bIdentity = await acquireWorkspaceIdentity(
            provider,
            workspaceId,
            deviceB,
            () => {
                bFallbackCalls += 1;
                return {
                    workspaceId,
                    userId: generateId(IdType.User),
                    name: 'Other',
                };
            }
        );
        expect(bFallbackCalls).toBe(0);
        expect(bIdentity).toEqual(aIdentity);
    });

    it('treats a corrupted manifest as absent', async () => {
        const workspaceId = generateId(IdType.Workspace);
        const key = workspaceManifestKey(workspaceId);
        await fs.promises.mkdir(path.dirname(path.join(tempDir, key)), {
            recursive: true,
        });
        await fs.promises.writeFile(
            path.join(tempDir, key),
            'not-json',
            'utf-8'
        );

        expect(await readWorkspaceManifest(provider, workspaceId)).toBeNull();
    });

    describe('legacy root manifest migration', () => {
        it('moves the root manifest under workspaces/<wsId>/ and deletes the root copy', async () => {
            const workspaceId = generateId(IdType.Workspace);
            const manifest = {
                workspaceId,
                userId: generateId(IdType.User),
                name: 'Legacy',
                createdAt: new Date().toISOString(),
                createdByDeviceId: generateId(IdType.Device),
            };

            await provider.upload(
                LEGACY_WORKSPACE_MANIFEST_KEY,
                Buffer.from(JSON.stringify(manifest, null, 2), 'utf-8')
            );

            const migrated = await migrateLegacyRootManifest(provider);
            expect(migrated).toBe(true);

            expect(await readLegacyRootManifest(provider)).toBeNull();
            expect(await readWorkspaceManifest(provider, workspaceId)).toEqual(
                manifest
            );
        });

        it('is a no-op when there is no legacy root manifest', async () => {
            expect(await migrateLegacyRootManifest(provider)).toBe(false);
        });

        it('preserves an existing per-workspace manifest and still removes the root copy', async () => {
            const workspaceId = generateId(IdType.Workspace);
            const perWorkspace = {
                workspaceId,
                userId: generateId(IdType.User),
                name: 'Per-workspace',
                createdAt: new Date().toISOString(),
                createdByDeviceId: generateId(IdType.Device),
            };
            await writeWorkspaceManifest(provider, perWorkspace);

            const root = {
                workspaceId,
                userId: generateId(IdType.User),
                name: 'Different name in root',
                createdAt: new Date().toISOString(),
                createdByDeviceId: generateId(IdType.Device),
            };
            await provider.upload(
                LEGACY_WORKSPACE_MANIFEST_KEY,
                Buffer.from(JSON.stringify(root, null, 2), 'utf-8')
            );

            await migrateLegacyRootManifest(provider);

            expect(await readLegacyRootManifest(provider)).toBeNull();
            expect(await readWorkspaceManifest(provider, workspaceId)).toEqual(
                perWorkspace
            );
        });
    });
});
