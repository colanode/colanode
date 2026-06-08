import { StorageProvider } from '@colanode/client/services/backup';

export interface WorkspaceManifest {
    workspaceId: string;
    userId: string;
    name: string;
    createdAt: string;
    createdByDeviceId: string;
}

// Legacy single-workspace manifest lived at the storage root. Newer layouts
// place the manifest under workspaces/<workspaceId>/manifest.json so a single
// storage root can host multiple workspaces. The legacy key is still read on
// init to support a one-shot migration.
export const LEGACY_WORKSPACE_MANIFEST_KEY = 'manifest.json';

export const workspaceManifestKey = (workspaceId: string): string =>
    `workspaces/${workspaceId}/manifest.json`;

const parseManifest = (buf: Buffer): WorkspaceManifest | null => {
    try {
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

export const readWorkspaceManifest = async (
    provider: StorageProvider,
    workspaceId: string
): Promise<WorkspaceManifest | null> => {
    const key = workspaceManifestKey(workspaceId);
    if (!(await provider.exists(key))) {
        return null;
    }

    try {
        const buf = await provider.download(key);
        return parseManifest(buf);
    } catch {
        return null;
    }
};

export const writeWorkspaceManifest = async (
    provider: StorageProvider,
    manifest: WorkspaceManifest
): Promise<void> => {
    await provider.upload(
        workspaceManifestKey(manifest.workspaceId),
        Buffer.from(JSON.stringify(manifest, null, 2), 'utf-8')
    );
};

// Reads the legacy root-level manifest. Returns null if absent or invalid.
// Used by the migration path to detect storage roots created by previous
// single-workspace builds and to identify which workspaceId they belong to.
export const readLegacyRootManifest = async (
    provider: StorageProvider
): Promise<WorkspaceManifest | null> => {
    if (!(await provider.exists(LEGACY_WORKSPACE_MANIFEST_KEY))) {
        return null;
    }

    try {
        const buf = await provider.download(LEGACY_WORKSPACE_MANIFEST_KEY);
        return parseManifest(buf);
    } catch {
        return null;
    }
};

// Idempotent: copies the legacy root manifest under its workspace subtree
// (if not already there) and deletes the root copy. Safe to call on every
// init — does nothing once the legacy file is gone. Returns true if a
// migration took place.
export const migrateLegacyRootManifest = async (
    provider: StorageProvider
): Promise<boolean> => {
    const legacy = await readLegacyRootManifest(provider);
    if (!legacy) {
        return false;
    }

    const targetKey = workspaceManifestKey(legacy.workspaceId);
    const targetExists = await provider.exists(targetKey);
    if (!targetExists) {
        await writeWorkspaceManifest(provider, legacy);
    }
    await provider.delete(LEGACY_WORKSPACE_MANIFEST_KEY);
    return true;
};

// Reads the manifest for the given workspaceId. If absent, calls fallback to
// seed a new identity, then persists it (first-write-wins). The caller is
// responsible for ensuring fallback.workspaceId equals the workspaceId
// argument so that the manifest lives at the correct per-workspace key.
export const acquireWorkspaceIdentity = async (
    provider: StorageProvider,
    workspaceId: string,
    deviceId: string,
    fallback: () => {
        workspaceId: string;
        userId: string;
        name: string;
    }
): Promise<WorkspaceManifest> => {
    const existing = await readWorkspaceManifest(provider, workspaceId);
    if (existing) {
        return existing;
    }

    const seed = fallback();
    if (seed.workspaceId !== workspaceId) {
        throw new Error(
            `acquireWorkspaceIdentity fallback returned workspaceId ${seed.workspaceId} but expected ${workspaceId}`
        );
    }

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
