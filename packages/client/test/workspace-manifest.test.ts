import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { LocalStorageProvider } from '@colanode/client/services/backup';
import {
    acquireWorkspaceIdentity,
    readWorkspaceManifest,
    WORKSPACE_MANIFEST_KEY,
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
        expect(await readWorkspaceManifest(provider)).toBeNull();
    });

    it('round-trips a manifest through the storage provider', async () => {
        const manifest = {
            workspaceId: generateId(IdType.Workspace),
            userId: generateId(IdType.User),
            name: 'Local',
            createdAt: new Date().toISOString(),
            createdByDeviceId: generateId(IdType.Device),
        };

        await writeWorkspaceManifest(provider, manifest);

        const persisted = path.join(tempDir, WORKSPACE_MANIFEST_KEY);
        expect(fs.existsSync(persisted)).toBe(true);

        const loaded = await readWorkspaceManifest(provider);
        expect(loaded).toEqual(manifest);
    });

    it('writes a fresh manifest on first acquire and reuses it afterwards', async () => {
        const deviceA = generateId(IdType.Device);
        const deviceB = generateId(IdType.Device);

        let aFallbackCalls = 0;
        const aIdentity = await acquireWorkspaceIdentity(provider, deviceA, () => {
            aFallbackCalls += 1;
            return {
                workspaceId: generateId(IdType.Workspace),
                userId: generateId(IdType.User),
                name: 'My Workspace',
            };
        });
        expect(aFallbackCalls).toBe(1);
        expect(aIdentity.createdByDeviceId).toBe(deviceA);

        let bFallbackCalls = 0;
        const bIdentity = await acquireWorkspaceIdentity(provider, deviceB, () => {
            bFallbackCalls += 1;
            return {
                workspaceId: generateId(IdType.Workspace),
                userId: generateId(IdType.User),
                name: 'Other',
            };
        });
        expect(bFallbackCalls).toBe(0);
        expect(bIdentity).toEqual(aIdentity);
    });

    it('treats a corrupted manifest as absent', async () => {
        await fs.promises.writeFile(
            path.join(tempDir, WORKSPACE_MANIFEST_KEY),
            'not-json',
            'utf-8'
        );

        expect(await readWorkspaceManifest(provider)).toBeNull();
    });
});
