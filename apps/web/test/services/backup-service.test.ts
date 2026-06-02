import { createHash } from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BackupService } from '@colanode/client/services/backup';
import type {
    StorageProvider,
    BackupProgress,
} from '@colanode/client/services/backup';

/**
 * In-memory StorageProvider for testing.
 */
class MemoryStorageProvider implements StorageProvider {
    readonly name = 'memory';
    private store = new Map<string, Buffer>();

    async init(): Promise<void> {
        // no-op
    }

    async upload(key: string, data: Buffer): Promise<void> {
        this.store.set(key, Buffer.from(data));
    }

    async download(key: string): Promise<Buffer> {
        const data = this.store.get(key);
        if (!data) {
            throw new Error(`Key not found: ${key}`);
        }
        return data;
    }

    async list(prefix: string): Promise<string[]> {
        return Array.from(this.store.keys()).filter((k) => k.startsWith(prefix));
    }

    async delete(key: string): Promise<void> {
        this.store.delete(key);
    }

    async exists(key: string): Promise<boolean> {
        return this.store.has(key);
    }

    /** Expose store size for assertions. */
    get size(): number {
        return this.store.size;
    }

    clear(): void {
        this.store.clear();
    }
}

function sha256(data: string | Buffer): string {
    return createHash('sha256').update(data).digest('hex');
}

describe('services/backup-service', () => {
    let tmpDir: string;
    let provider: MemoryStorageProvider;

    beforeEach(async () => {
        tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'backup-test-'));
        provider = new MemoryStorageProvider();
    });

    afterEach(async () => {
        await fs.promises.rm(tmpDir, { recursive: true, force: true });
    });

    function createService(storagePath?: string): BackupService {
        return new BackupService(storagePath ?? tmpDir, provider, '1.0.0-test');
    }

    async function writeFile(relativePath: string, content: string) {
        const filePath = path.join(tmpDir, relativePath);
        await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
        await fs.promises.writeFile(filePath, content, 'utf-8');
    }

    describe('backup', () => {
        it('backs up files and creates a manifest', async () => {
            await writeFile('app.db', 'database-content');
            await writeFile('storage-config.json', '{"version":1}');
            await writeFile('workspaces/user1/workspace.db', 'workspace-content');

            const service = createService();

            // Mock checkpoint to avoid requiring better-sqlite3
            vi.spyOn(service, 'checkpoint').mockResolvedValue(undefined);

            const backupId = await service.backup();

            expect(backupId).toBeTruthy();
            expect(typeof backupId).toBe('string');

            // Should have uploaded files + manifest
            expect(provider.size).toBeGreaterThanOrEqual(4); // 3 files + 1 manifest

            // Verify manifest exists and is valid
            const keys = await provider.list('backups/');
            const manifestKey = keys.find((k) => k.endsWith('/manifest.json'));
            expect(manifestKey).toBeDefined();

            const manifestData = await provider.download(manifestKey!);
            const manifest = JSON.parse(manifestData.toString());

            expect(manifest.version).toBe(1);
            expect(manifest.appVersion).toBe('1.0.0-test');
            expect(manifest.files).toHaveLength(3);
            expect(manifest.totalSize).toBeGreaterThan(0);

            // Verify each file has correct sha256
            for (const file of manifest.files) {
                const originalContent = await fs.promises.readFile(
                    path.join(tmpDir, file.path)
                );
                expect(file.sha256).toBe(sha256(originalContent));
            }
        });

        it('reports progress during backup', async () => {
            await writeFile('file1.txt', 'hello');
            await writeFile('file2.txt', 'world');

            const service = createService();
            vi.spyOn(service, 'checkpoint').mockResolvedValue(undefined);

            const progressUpdates: BackupProgress[] = [];
            await service.backup((progress) => {
                progressUpdates.push({ ...progress });
            });

            expect(progressUpdates.length).toBeGreaterThan(0);

            // Should start with scanning phase
            expect(progressUpdates[0]!.phase).toBe('scanning');

            // Should end with done phase
            expect(progressUpdates[progressUpdates.length - 1]!.phase).toBe('done');

            // Should have uploading phase in between
            const uploadPhases = progressUpdates.filter(
                (p) => p.phase === 'uploading'
            );
            expect(uploadPhases.length).toBeGreaterThan(0);
        });

        it('excludes WAL/SHM and temp files', async () => {
            await writeFile('app.db', 'database');
            await writeFile('app.db-wal', 'wal-data');
            await writeFile('app.db-shm', 'shm-data');
            await writeFile('temp/upload.tmp', 'temp-data');
            await writeFile('data.json', '{}');

            const service = createService();
            vi.spyOn(service, 'checkpoint').mockResolvedValue(undefined);

            await service.backup();

            const keys = await provider.list('backups/');
            const manifestKey = keys.find((k) => k.endsWith('/manifest.json'))!;
            const manifest = JSON.parse(
                (await provider.download(manifestKey)).toString()
            );

            const paths = manifest.files.map((f: { path: string }) => f.path);
            expect(paths).toContain('app.db');
            expect(paths).toContain('data.json');
            expect(paths).not.toContain('app.db-wal');
            expect(paths).not.toContain('app.db-shm');
            expect(paths).not.toContain('temp/upload.tmp');
        });

        it('performs incremental backup skipping unchanged files', async () => {
            await writeFile('file1.txt', 'content-1');
            await writeFile('file2.txt', 'content-2');

            const service = createService();
            vi.spyOn(service, 'checkpoint').mockResolvedValue(undefined);

            // First backup
            await service.backup();
            const firstSize = provider.size;

            // Second backup without changes — should still upload manifest
            // but skip unchanged file content
            await service.backup();
            const secondSize = provider.size;

            // Second backup adds new manifest + no new file data
            // (new backup prefix with only manifest, files are skipped)
            expect(secondSize).toBeLessThan(firstSize * 2);
        });
    });

    describe('listBackups', () => {
        it('lists backups sorted by date descending', async () => {
            await writeFile('data.txt', 'test');

            const service = createService();
            vi.spyOn(service, 'checkpoint').mockResolvedValue(undefined);

            // Create two backups
            const id1 = await service.backup();

            // Small delay to ensure different timestamps
            await new Promise((resolve) => setTimeout(resolve, 50));

            await writeFile('data.txt', 'updated');
            const id2 = await service.backup();

            const backups = await service.listBackups();
            expect(backups).toHaveLength(2);

            // Most recent first
            expect(backups[0]!.id).toBe(id2);
            expect(backups[1]!.id).toBe(id1);

            // Each backup should have metadata
            for (const backup of backups) {
                expect(backup.createdAt).toBeTruthy();
                expect(backup.fileCount).toBeGreaterThan(0);
                expect(backup.totalSize).toBeGreaterThan(0);
            }
        });

        it('returns empty array when no backups exist', async () => {
            const service = createService();
            const backups = await service.listBackups();
            expect(backups).toHaveLength(0);
        });
    });

    describe('restore', () => {
        it('restores files from backup to target path', async () => {
            await writeFile('app.db', 'database-content');
            await writeFile('config.json', '{"key":"value"}');
            await writeFile('workspaces/u1/workspace.db', 'ws-data');

            const service = createService();
            vi.spyOn(service, 'checkpoint').mockResolvedValue(undefined);

            const backupId = await service.backup();

            // Restore to a different directory
            const restoreDir = await fs.promises.mkdtemp(
                path.join(os.tmpdir(), 'restore-test-')
            );

            try {
                await service.restore(backupId, restoreDir);

                // Verify all files were restored with correct content
                const restoredApp = await fs.promises.readFile(
                    path.join(restoreDir, 'app.db'),
                    'utf-8'
                );
                expect(restoredApp).toBe('database-content');

                const restoredConfig = await fs.promises.readFile(
                    path.join(restoreDir, 'config.json'),
                    'utf-8'
                );
                expect(restoredConfig).toBe('{"key":"value"}');

                const restoredWs = await fs.promises.readFile(
                    path.join(restoreDir, 'workspaces/u1/workspace.db'),
                    'utf-8'
                );
                expect(restoredWs).toBe('ws-data');
            } finally {
                await fs.promises.rm(restoreDir, { recursive: true, force: true });
            }
        });

        it('reports progress during restore', async () => {
            await writeFile('file1.txt', 'data1');
            await writeFile('file2.txt', 'data2');

            const service = createService();
            vi.spyOn(service, 'checkpoint').mockResolvedValue(undefined);

            const backupId = await service.backup();

            const restoreDir = await fs.promises.mkdtemp(
                path.join(os.tmpdir(), 'restore-progress-')
            );

            try {
                const progressUpdates: BackupProgress[] = [];
                await service.restore(backupId, restoreDir, (progress) => {
                    progressUpdates.push({ ...progress });
                });

                expect(progressUpdates.length).toBeGreaterThan(0);
                expect(progressUpdates[progressUpdates.length - 1]!.phase).toBe(
                    'done'
                );

                const downloadPhases = progressUpdates.filter(
                    (p) => p.phase === 'downloading'
                );
                expect(downloadPhases.length).toBe(2);
            } finally {
                await fs.promises.rm(restoreDir, { recursive: true, force: true });
            }
        });

        it('throws on checksum mismatch', async () => {
            await writeFile('important.dat', 'original-data');

            const service = createService();
            vi.spyOn(service, 'checkpoint').mockResolvedValue(undefined);

            const backupId = await service.backup();

            // Corrupt the stored file
            const keys = await provider.list('backups/');
            const dataKey = keys.find(
                (k) => k.includes('important.dat') && !k.endsWith('manifest.json')
            );
            expect(dataKey).toBeDefined();
            await provider.upload(dataKey!, Buffer.from('corrupted-data'));

            const restoreDir = await fs.promises.mkdtemp(
                path.join(os.tmpdir(), 'restore-corrupt-')
            );

            try {
                await expect(
                    service.restore(backupId, restoreDir)
                ).rejects.toThrow('Checksum mismatch');
            } finally {
                await fs.promises.rm(restoreDir, { recursive: true, force: true });
            }
        });
    });

    describe('round-trip integrity', () => {
        it('backup and restore preserves file content exactly', async () => {
            // Create diverse file types
            const files = {
                'app.db': Buffer.from([0x00, 0x01, 0x02, 0xff, 0xfe, 0xfd]),
                'storage-config.json': '{"version":1,"locale":"zh-CN"}',
                'workspaces/user1/workspace.db': Buffer.alloc(1024, 0xab),
                'workspaces/user1/files/doc1.pdf': Buffer.from('fake-pdf-content'),
                'avatars/avatar1.png': Buffer.from('fake-png-data'),
            };

            for (const [relativePath, content] of Object.entries(files)) {
                const filePath = path.join(tmpDir, relativePath);
                await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
                await fs.promises.writeFile(filePath, content);
            }

            const service = createService();
            vi.spyOn(service, 'checkpoint').mockResolvedValue(undefined);

            const backupId = await service.backup();

            const restoreDir = await fs.promises.mkdtemp(
                path.join(os.tmpdir(), 'roundtrip-')
            );

            try {
                await service.restore(backupId, restoreDir);

                for (const [relativePath, originalContent] of Object.entries(files)) {
                    const restoredData = await fs.promises.readFile(
                        path.join(restoreDir, relativePath)
                    );
                    const originalData = Buffer.isBuffer(originalContent)
                        ? originalContent
                        : Buffer.from(originalContent);
                    expect(restoredData.equals(originalData)).toBe(true);
                }
            } finally {
                await fs.promises.rm(restoreDir, { recursive: true, force: true });
            }
        });
    });
});
