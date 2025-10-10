import { createReadStream, createWriteStream, promises as fs } from 'fs';
import { Readable } from 'stream';

import { DataStore } from '@tus/server';
import { FileStore } from '@tus/file-store';
import type { FileStorageConfig } from '@colanode/server/lib/config/storage';

import type { Storage } from './core';

export class FileSystemStorage implements Storage {
  private readonly directory: string;
  public readonly tusStore: DataStore;

  constructor(config: FileStorageConfig) {
    this.directory = config.directory;
    this.tusStore = new FileStore({ directory: this.directory });
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
