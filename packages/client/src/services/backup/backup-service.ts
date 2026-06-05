import { createHash } from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';

import { createDebugger } from '@colanode/core';

import { StorageProvider } from './storage-provider';
import {
    BackupManifest,
    BackupManifestFile,
    BackupListItem,
    BackupProgressCallback,
} from './types';

const debug = createDebugger('desktop:service:backup');

const MANIFEST_KEY = 'manifest.json';
const BACKUP_PREFIX = 'backups/';
// Content-addressed blob store. Every file uploaded by backup() is keyed by
// its sha256 so identical bytes are stored once across all backupIds and any
// single backup can be fully restored from its manifest alone.
const BLOBS_PREFIX = 'backups/blobs/';

const EXCLUDE_PATTERNS = [
    // .db files are snapshotted via VACUUM INTO; the live -wal/-shm sidecars
    // are pure scratch space and meaningless without their producing process.
    /.*-wal$/,
    /.*-shm$/,
    // Temp files are ephemeral
    /^temp\//,
    // macOS metadata
    /\.DS_Store$/,
    // Electron / Chromium internal caches and state
    /^\.vite\//,
    /^GPUCache\//,
    /^Cache\//,
    /^Code Cache\//,
    /^DawnGraphiteCache\//,
    /^DawnWebGPUCache\//,
    /^Local Storage\//,
    /^Session Storage\//,
    /^Network\//,
    /^Network Persistent State$/,
    /^Shared Dictionary\//,
    /^SharedStorage$/,
    /^Trust Tokens/,
    /^DIPS$/,
    /^blob_storage\//,
    /^Crashpad\//,
    /^Preferences$/,
    /^TransportSecurity$/,
    /^databases$/,
    /^IndexedDB\//,
    /^WebStorage\//,
    /^Service Worker\//,
    /^File System\//,
    /^LOG$/,
    /^LOG\.old$/,
    /^LOCK$/,
    /^MANIFEST-/,
    /^\.org\.chromium\./,
    // journal files (non-WAL SQLite temp)
    /.*-journal$/,
];

function shouldExclude(relativePath: string): boolean {
    return EXCLUDE_PATTERNS.some((pattern) => pattern.test(relativePath));
}

async function computeSha256(filePath: string): Promise<string> {
    const data = await fs.promises.readFile(filePath);
    return createHash('sha256').update(data).digest('hex');
}

async function walkDirectory(
    dir: string,
    baseDir: string
): Promise<{ relativePath: string; absolutePath: string; stat: fs.Stats }[]> {
    const results: {
        relativePath: string;
        absolutePath: string;
        stat: fs.Stats;
    }[] = [];

    let entries: fs.Dirent[];
    try {
        entries = await fs.promises.readdir(dir, { withFileTypes: true });
    } catch {
        return results;
    }

    for (const entry of entries) {
        const absolutePath = path.join(dir, entry.name);
        const relativePath = path.relative(baseDir, absolutePath);

        if (shouldExclude(relativePath)) {
            continue;
        }

        if (entry.isDirectory()) {
            const subResults = await walkDirectory(absolutePath, baseDir);
            results.push(...subResults);
        } else if (entry.isFile()) {
            const stat = await fs.promises.stat(absolutePath);
            results.push({ relativePath, absolutePath, stat });
        }
    }

    return results;
}

export class BackupService {
    private readonly storagePath: string;
    private readonly provider: StorageProvider;
    private readonly appVersion: string;

    constructor(
        storagePath: string,
        provider: StorageProvider,
        appVersion: string
    ) {
        this.storagePath = storagePath;
        this.provider = provider;
        this.appVersion = appVersion;
    }

    async checkpoint(): Promise<void> {
        // Deprecated: kept for callers that may still invoke it. The real work
        // is now done by snapshotDatabases(), which produces a consistent copy
        // of every database via SQLite's online VACUUM INTO. The old TRUNCATE
        // checkpoint silently failed whenever the main process held an active
        // reader/writer connection, which made it possible to ship backups
        // missing every write that lived only in the WAL file.
        debug('checkpoint() is a no-op; use snapshotDatabases() instead');
    }

    // Returns a map keyed by storage-relative path of every .db file in the
    // workspace, pointing at a fresh on-disk snapshot produced by VACUUM INTO.
    // VACUUM INTO is the safe online copy primitive in SQLite: it does not
    // require an EXCLUSIVE lock and produces a self-contained database that
    // already includes everything that lives in the source WAL. The caller is
    // responsible for deleting the returned tmp directory once the snapshots
    // are no longer needed (handled by backup() via try/finally).
    private async snapshotDatabases(): Promise<{
        tmpDir: string;
        snapshots: Map<string, string>;
    }> {
        const BetterSqlite3 = (await import('better-sqlite3')).default;

        const tmpDir = await fs.promises.mkdtemp(
            path.join(os.tmpdir(), 'colanode-backup-')
        );
        const snapshots = new Map<string, string>();

        const dbFiles = await this.findDatabaseFiles();
        for (const dbPath of dbFiles) {
            const relativePath = path.relative(this.storagePath, dbPath);
            const snapshotPath = path.join(tmpDir, relativePath);
            await fs.promises.mkdir(path.dirname(snapshotPath), {
                recursive: true,
            });

            try {
                debug(`Snapshotting database: ${dbPath} -> ${snapshotPath}`);
                const db = new BetterSqlite3(dbPath, { readonly: true });
                try {
                    // Use a parameter so an odd snapshot path cannot be parsed as
                    // SQL. better-sqlite3 supports prepare/run for VACUUM INTO.
                    db.prepare('VACUUM INTO ?').run(snapshotPath);
                } finally {
                    db.close();
                }
                snapshots.set(relativePath, snapshotPath);
            } catch (err) {
                debug(`Failed to snapshot ${dbPath}: ${err}`);
                throw new Error(
                    `Failed to snapshot database ${relativePath}: ${err instanceof Error ? err.message : String(err)}`
                );
            }
        }

        return { tmpDir, snapshots };
    }

    private async findDatabaseFiles(): Promise<string[]> {
        const dbFiles: string[] = [];
        const appDb = path.join(this.storagePath, 'app.db');
        if (fs.existsSync(appDb)) {
            dbFiles.push(appDb);
        }

        const workspacesDir = path.join(this.storagePath, 'workspaces');
        if (fs.existsSync(workspacesDir)) {
            const entries = await fs.promises.readdir(workspacesDir, {
                withFileTypes: true,
            });
            for (const entry of entries) {
                if (entry.isDirectory()) {
                    const wsDb = path.join(workspacesDir, entry.name, 'workspace.db');
                    if (fs.existsSync(wsDb)) {
                        dbFiles.push(wsDb);
                    }
                }
            }
        }
        return dbFiles;
    }

    async backup(onProgress?: BackupProgressCallback): Promise<string> {
        debug('Starting backup');
        await this.provider.init();

        // Phase 1: Snapshot every SQLite database via VACUUM INTO so the bytes
        // we hash and upload reflect all committed data, including writes that
        // still live in the WAL of the live desktop process.
        const { tmpDir, snapshots } = await this.snapshotDatabases();

        try {
            // Phase 2: Scan files
            onProgress?.({
                phase: 'scanning',
                current: 0,
                total: 0,
            });

            const files = await walkDirectory(this.storagePath, this.storagePath);
            const manifestFiles: BackupManifestFile[] = [];
            let totalSize = 0;

            debug(`Found ${files.length} files to backup`);

            for (const file of files) {
                // Prefer the snapshot for live SQLite databases so the
                // hash/size/mtime reflect the consistent copy that will be
                // uploaded, not the partially-flushed bytes on disk.
                const snapshotAbs = snapshots.get(file.relativePath);
                const sourceAbs = snapshotAbs ?? file.absolutePath;
                const sourceStat = snapshotAbs
                    ? await fs.promises.stat(snapshotAbs)
                    : file.stat;
                const sha256 = await computeSha256(sourceAbs);
                manifestFiles.push({
                    path: file.relativePath,
                    size: sourceStat.size,
                    sha256,
                    mtime: sourceStat.mtimeMs,
                });
                totalSize += sourceStat.size;
            }

            // Phase 3: Upload file blobs (content-addressed, deduped)
            const backupId = new Date().toISOString().replace(/[:.]/g, '-');
            const backupPrefix = `${BACKUP_PREFIX}${backupId}/`;

            let uploaded = 0;
            let skipped = 0;
            const total = manifestFiles.length;

            for (const file of manifestFiles) {
                onProgress?.({
                    phase: 'uploading',
                    current: uploaded + skipped,
                    total,
                    currentFile: file.path,
                });

                // Dedup via content addressing: if a blob with this sha256 is
                // already present (from any prior backupId), skip the upload.
                const blobKey = `${BLOBS_PREFIX}${file.sha256}`;
                if (await this.provider.exists(blobKey)) {
                    skipped++;
                    continue;
                }

                const snapshotAbs = snapshots.get(file.path);
                const sourceAbs =
                    snapshotAbs ?? path.join(this.storagePath, file.path);
                const fileData = await fs.promises.readFile(sourceAbs);
                await this.provider.upload(blobKey, fileData);
                uploaded++;
            }

            debug(`Uploaded ${uploaded} blobs, skipped ${skipped} already present`);

            // Phase 4: Upload manifest
            const manifest: BackupManifest = {
                version: 1,
                createdAt: new Date().toISOString(),
                appVersion: this.appVersion,
                storagePath: this.storagePath,
                files: manifestFiles,
                totalSize,
            };

            await this.provider.upload(
                `${backupPrefix}${MANIFEST_KEY}`,
                Buffer.from(JSON.stringify(manifest, null, 2))
            );

            onProgress?.({
                phase: 'done',
                current: total,
                total,
            });

            debug(`Backup complete: ${backupId}`);
            return backupId;
        } finally {
            // Always remove the snapshot tmp directory so it does not leak.
            await fs.promises
                .rm(tmpDir, { recursive: true, force: true })
                .catch((err) => {
                    debug(`Failed to remove backup snapshot tmpdir ${tmpDir}: ${err}`);
                });
        }
    }

    async listBackups(): Promise<BackupListItem[]> {
        await this.provider.init();
        const keys = await this.provider.list(BACKUP_PREFIX);

        const manifestKeys = keys.filter((k) => k.endsWith(`/${MANIFEST_KEY}`));
        const items: BackupListItem[] = [];

        for (const key of manifestKeys) {
            try {
                const data = await this.provider.download(key);
                const manifest = JSON.parse(data.toString()) as BackupManifest;
                const id = key
                    .replace(BACKUP_PREFIX, '')
                    .replace(`/${MANIFEST_KEY}`, '');
                items.push({
                    id,
                    createdAt: manifest.createdAt,
                    totalSize: manifest.totalSize,
                    fileCount: manifest.files.length,
                });
            } catch {
                debug(`Failed to read manifest: ${key}`);
            }
        }

        return items.sort(
            (a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }

    async restore(
        backupId: string,
        targetPath?: string,
        onProgress?: BackupProgressCallback
    ): Promise<void> {
        debug(`Starting restore from backup: ${backupId}`);
        await this.provider.init();

        const restorePath = targetPath ?? this.storagePath;
        const manifestKey = `${BACKUP_PREFIX}${backupId}/${MANIFEST_KEY}`;

        // Phase 1: Download manifest
        const manifestData = await this.provider.download(manifestKey);
        const manifest = JSON.parse(manifestData.toString()) as BackupManifest;

        debug(`Restoring ${manifest.files.length} files`);

        // Phase 2: Download and restore files
        const total = manifest.files.length;
        let restored = 0;

        for (const file of manifest.files) {
            onProgress?.({
                phase: 'downloading',
                current: restored,
                total,
                currentFile: file.path,
            });

            // Prefer the content-addressed blob store. Fall back to the
            // legacy per-backupId layout so backups produced by earlier
            // versions of this code can still be restored.
            const blobKey = `${BLOBS_PREFIX}${file.sha256}`;
            let data: Buffer;
            if (await this.provider.exists(blobKey)) {
                data = await this.provider.download(blobKey);
            } else {
                const legacyKey = `${BACKUP_PREFIX}${backupId}/${file.path}`;
                data = await this.provider.download(legacyKey);
            }

            // Verify checksum
            const actualHash = createHash('sha256').update(data).digest('hex');
            if (actualHash !== file.sha256) {
                throw new Error(
                    `Checksum mismatch for ${file.path}: expected ${file.sha256}, got ${actualHash}`
                );
            }

            const targetFilePath = path.join(restorePath, file.path);
            await fs.promises.mkdir(path.dirname(targetFilePath), {
                recursive: true,
            });
            await fs.promises.writeFile(targetFilePath, data);

            restored++;
        }

        onProgress?.({
            phase: 'done',
            current: total,
            total,
        });

        debug(`Restore complete: ${restored} files`);
    }
}
