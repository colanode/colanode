import { StorageProvider } from '@colanode/client/services/backup';

export const WORKSPACE_MANIFEST_KEY = 'manifest.json';

export interface WorkspaceManifest {
    workspaceId: string;
    userId: string;
    name: string;
    createdAt: string;
    createdByDeviceId: string;
}

export const readWorkspaceManifest = async (
    provider: StorageProvider
): Promise<WorkspaceManifest | null> => {
    if (!(await provider.exists(WORKSPACE_MANIFEST_KEY))) {
        return null;
    }

    try {
        const buf = await provider.download(WORKSPACE_MANIFEST_KEY);
        const parsed = JSON.parse(buf.toString('utf-8')) as WorkspaceManifest;
        if (
            typeof parsed?.workspaceId === 'string' &&
            typeof parsed?.userId === 'string' &&
            typeof parsed?.name === 'string'
        ) {
            return parsed;
        }
        return null;
    } catch {
        return null;
    }
};

export const writeWorkspaceManifest = async (
    provider: StorageProvider,
    manifest: WorkspaceManifest
): Promise<void> => {
    await provider.upload(
        WORKSPACE_MANIFEST_KEY,
        Buffer.from(JSON.stringify(manifest, null, 2), 'utf-8')
    );
};

// Reads the workspace identity manifest from the shared storage. If absent,
// the fallback is invoked to seed a new identity, which is then persisted
// (first-write-wins across devices). MVP assumption: device initialization
// happens serially, so the first device to boot is the manifest writer.
export const acquireWorkspaceIdentity = async (
    provider: StorageProvider,
    deviceId: string,
    fallback: () => {
        workspaceId: string;
        userId: string;
        name: string;
    }
): Promise<WorkspaceManifest> => {
    const existing = await readWorkspaceManifest(provider);
    if (existing) {
        return existing;
    }

    const seed = fallback();
    const manifest: WorkspaceManifest = {
        workspaceId: seed.workspaceId,
        userId: seed.userId,
        name: seed.name,
        createdAt: new Date().toISOString(),
        createdByDeviceId: deviceId,
    };
    await writeWorkspaceManifest(provider, manifest);
    return manifest;
};
