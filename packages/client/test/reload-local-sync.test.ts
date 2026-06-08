import os from 'node:os';
import path from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import type { AppMeta, LocalSyncConfig } from '@colanode/client/services/app-meta';
import { AppService } from '@colanode/client/services/app-service';
import type { WorkspaceService } from '@colanode/client/services/workspaces/workspace-service';

// `reloadLocalSync` only touches `meta.localSync` and iterates `workspaces`,
// so we can exercise it against a small stub bound to `AppService.prototype`
// without standing up the full service graph.
const buildStub = (
    meta: AppMeta,
    workspaces: Array<{ id: string; applyLocalSync: ReturnType<typeof vi.fn> }>
) => {
    const map = new Map<string, Partial<WorkspaceService>>();
    for (const ws of workspaces) {
        map.set(ws.id, {
            applyLocalSync: ws.applyLocalSync as unknown as WorkspaceService['applyLocalSync'],
        });
    }
    return { meta, workspaces: map };
};

describe('AppService.reloadLocalSync', () => {
    const baseMeta = (): AppMeta => ({
        type: 'desktop',
        platform: 'darwin',
        localOnly: true,
    });

    const sampleConfig = (deviceId: string): LocalSyncConfig => ({
        deviceId,
        storage: {
            type: 'local',
            path: path.join(os.tmpdir(), `colanode-test-${deviceId}`),
        },
    });

    it('writes the new config onto meta and propagates to every workspace', async () => {
        const meta = baseMeta();
        const w1 = { id: 'w1', applyLocalSync: vi.fn().mockResolvedValue(undefined) };
        const w2 = { id: 'w2', applyLocalSync: vi.fn().mockResolvedValue(undefined) };
        const stub = buildStub(meta, [w1, w2]);
        const config = sampleConfig('device-a');

        await AppService.prototype.reloadLocalSync.call(
            stub as unknown as AppService,
            config
        );

        expect(stub.meta.localSync).toEqual(config);
        expect(w1.applyLocalSync).toHaveBeenCalledTimes(1);
        expect(w1.applyLocalSync).toHaveBeenCalledWith(config);
        expect(w2.applyLocalSync).toHaveBeenCalledTimes(1);
        expect(w2.applyLocalSync).toHaveBeenCalledWith(config);
    });

    it('clears meta.localSync and tells every workspace to tear down when given null', async () => {
        const meta: AppMeta = { ...baseMeta(), localSync: sampleConfig('device-a') };
        const w1 = { id: 'w1', applyLocalSync: vi.fn().mockResolvedValue(undefined) };
        const stub = buildStub(meta, [w1]);

        await AppService.prototype.reloadLocalSync.call(
            stub as unknown as AppService,
            null
        );

        expect(stub.meta.localSync).toBeUndefined();
        expect(w1.applyLocalSync).toHaveBeenCalledWith(null);
    });

    it('is a no-op against workspaces when no workspaces are registered', async () => {
        const meta = baseMeta();
        const stub = buildStub(meta, []);
        const config = sampleConfig('device-x');

        await expect(
            AppService.prototype.reloadLocalSync.call(
                stub as unknown as AppService,
                config
            )
        ).resolves.toBeUndefined();
        expect(stub.meta.localSync).toEqual(config);
    });
});
