import { createReadStream, createWriteStream, promises as fs } from 'fs';
import { Readable } from 'stream';

import { FileStore } from '@tus/file-store';
import { DataStore } from '@tus/server';

import { redis } from '@colanode/server/data/redis';
import type {
  FileStorageProviderConfig,
  TusConfig,
} from '@colanode/server/lib/config/storage';
import { RedisKvStore } from '@colanode/server/lib/storage/tus/redis-kv';

import type { Storage } from './core';

export class FileSystemStorage implements Storage {
  private readonly directory: string;
  private readonly store: DataStore;

  constructor(config: FileStorageProviderConfig, tusConfig: TusConfig) {
    this.directory = config.directory;
    this.store = new FileStore({
      directory: this.directory,
      configstore:
        tusConfig.cache.type === 'redis'
          ? new RedisKvStore(redis, tusConfig.cache.prefix)
          : undefined,
    });
  }

  public get tusStore(): DataStore {
    return this.store;
  }

  async download(
    path: string
  ): Promise<{ stream: Readable; contentType?: string }> {
    const fullPath = `${this.directory}/${path}`;
    const stream = createReadStream(fullPath);

    return {
      stream,
      contentType: undefined,
    };
  }

  async delete(path: string): Promise<void> {
    const fullPath = `${this.directory}/${path}`;
    await fs.unlink(fullPath);
  }

  async upload(
    path: string,
    data: Buffer | Readable,
    _contentType: string,
    _contentLength?: bigint
  ): Promise<void> {
    const fullPath = `${this.directory}/${path}`;
    const dirPath = fullPath.substring(0, fullPath.lastIndexOf('/'));
    await fs.mkdir(dirPath, { recursive: true });

    if (data instanceof Buffer) {
      await fs.writeFile(fullPath, data);
      return;
    }

    const writeStream = createWriteStream(fullPath);
    await new Promise<void>((resolve, reject) => {
      (data as Readable).pipe(writeStream);
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });
  }
}
