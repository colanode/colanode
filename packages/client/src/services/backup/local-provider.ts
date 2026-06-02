import fs from 'fs';
import path from 'path';

import { createDebugger } from '@colanode/core';

import { StorageProvider, LocalProviderConfig } from './storage-provider';

const debug = createDebugger('desktop:backup:local');

export class LocalStorageProvider implements StorageProvider {
    readonly name = 'local';
    private readonly basePath: string;

    constructor(config: LocalProviderConfig) {
        this.basePath = config.path;
    }

    async init(): Promise<void> {
        await fs.promises.mkdir(this.basePath, { recursive: true });
        debug(`Initialized local storage at: ${this.basePath}`);
    }

    async upload(key: string, data: Buffer): Promise<void> {
        const filePath = this.resolvePath(key);
        await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
        await fs.promises.writeFile(filePath, data);
    }

    async download(key: string): Promise<Buffer> {
        const filePath = this.resolvePath(key);
        return fs.promises.readFile(filePath);
    }

    async list(prefix: string): Promise<string[]> {
        const dir = this.resolvePath(prefix);
        return this.walkKeys(dir, prefix);
    }

    async delete(key: string): Promise<void> {
        const filePath = this.resolvePath(key);
        try {
            await fs.promises.unlink(filePath);
        } catch {
            // ignore if already deleted
        }
    }

    async exists(key: string): Promise<boolean> {
        const filePath = this.resolvePath(key);
        try {
            await fs.promises.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    private resolvePath(key: string): string {
        // Prevent path traversal
        const normalized = path.normalize(key).replace(/^(\.\.[/\\])+/, '');
        return path.join(this.basePath, normalized);
    }

    private async walkKeys(dir: string, prefix: string): Promise<string[]> {
        const keys: string[] = [];

        let entries: fs.Dirent[];
        try {
            entries = await fs.promises.readdir(dir, { withFileTypes: true });
        } catch {
            return keys;
        }

        for (const entry of entries) {
            const entryPath = path.join(dir, entry.name);
            const key = prefix.endsWith('/')
                ? `${prefix}${entry.name}`
                : `${prefix}/${entry.name}`;

            if (entry.isDirectory()) {
                const subKeys = await this.walkKeys(entryPath, key);
                keys.push(...subKeys);
            } else {
                keys.push(key);
            }
        }

        return keys;
    }
}
