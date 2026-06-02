import { createHash } from 'crypto';
import fs from 'fs';
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

const EXCLUDE_PATTERNS = [
    // WAL/SHM are checkpoint-ed before backup
    /.*-wal$/,
    /.*-shm$/,
    // Temp files are ephemeral
    /^temp\//,
    // Electron internal
    /^\.vite\//,
    /^GPUCache\//,
    /^Cache\//,
    /^Code Cache\//,
    /^Local Storage\//,
    /^Session Storage\//,
    /^Network\//,
    /^blob_storage\//,
    /^Crashpad\//,
    /^Preferences$/,
    /^TransportSecurity$/,
    /^databases$/,
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
        // Checkpoint WAL for all SQLite databases to ensure consistency
        const BetterSqlite3 = (await import('better-sqlite3')).default;

        const dbFiles = await this.findDatabaseFiles();
        for (const dbPath of dbFiles) {
            try {
                debug(`Checkpointing database: ${dbPath}`);
                const db = new BetterSqlite3(dbPath, { readonly: false });
                try {
                    db.pragma('wal_checkpoint(TRUNCATE)');
                } finally {
                    db.close();
                }
            } catch (err) {
                debug(`Failed to checkpoint ${dbPath}: ${err}`);
            }
        }
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

        // Phase 1: Checkpoint databases
        await this.checkpoint();

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
            const sha256 = await computeSha256(file.absolutePath);
            manifestFiles.push({
                path: file.relativePath,
                size: file.stat.size,
                sha256,
                mtime: file.stat.mtimeMs,
            });
            totalSize += file.stat.size;
        }

        // Phase 3: Check existing backup for incremental
        let existingManifest: BackupManifest | null = null;
        try {
            const latestManifestKey = await this.findLatestManifestKey();
            if (latestManifestKey) {
                const data = await this.provider.download(latestManifestKey);
                existingManifest = JSON.parse(data.toString()) as BackupManifest;
            }
        } catch {
            debug('No existing backup found, doing full backup');
        }

        // Phase 4: Upload files (incremental if possible)
        const backupId = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPrefix = `${BACKUP_PREFIX}${backupId}/`;

        const existingFileMap = new Map<string, BackupManifestFile>();
        if (existingManifest) {
            for (const f of existingManifest.files) {
                existingFileMap.set(f.path, f);
            }
        }

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

            // Skip if file unchanged since last backup
            const existing = existingFileMap.get(file.path);
            if (existing && existing.sha256 === file.sha256) {
                skipped++;
                continue;
            }

            const fileData = await fs.promises.readFile(
                path.join(this.storagePath, file.path)
            );
            await this.provider.upload(`${backupPrefix}${file.path}`, fileData);
            uploaded++;
        }

        debug(`Uploaded ${uploaded} files, skipped ${skipped} unchanged`);

        // Phase 5: Upload manifest
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

            const fileKey = `${BACKUP_PREFIX}${backupId}/${file.path}`;
            const data = await this.provider.download(fileKey);

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

    private async findLatestManifestKey(): Promise<string | null> {
        const keys = await this.provider.list(BACKUP_PREFIX);
        const manifestKeys = keys
            .filter((k) => k.endsWith(`/${MANIFEST_KEY}`))
            .sort()
            .reverse();

        return manifestKeys[0] ?? null;
    }
}
