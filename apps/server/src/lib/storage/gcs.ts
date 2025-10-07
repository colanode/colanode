import { Readable } from 'stream';

import { RedisClientType } from '@redis/client';
import { Storage, Bucket, File } from '@google-cloud/storage';
import { DataStore } from '@tus/server';
import { GCSStore } from '@tus/gcs-store';

import type { Storage as StorageInterface } from './core';

interface GCSStorageConfig {
  bucket: string;
  projectId: string;
  credentials: string;
}

export class GCSStorage implements StorageInterface {
  private readonly bucket: Bucket;
  private tusStore: DataStore | null = null;

  constructor(config: GCSStorageConfig) {
    const storage = new Storage({
      projectId: config.projectId,
      keyFilename: config.credentials,
    });

    this.bucket = storage.bucket(config.bucket);
  }

  private getFile(path: string): File {
    return this.bucket.file(path);
  }

  async download(
    path: string
  ): Promise<{ stream: Readable; contentType?: string }> {
    const file = this.getFile(path);
    const [metadata] = await file.getMetadata();
    const stream = file.createReadStream();

    return {
      stream,
      contentType: metadata.contentType,
    };
  }

  async delete(path: string): Promise<void> {
    const file = this.getFile(path);
    await file.delete();
  }

  async upload(
    path: string,
    data: Buffer | Readable,
    contentType: string,
    _contentLength?: bigint
  ): Promise<void> {
    const file = this.getFile(path);

    if (data instanceof Buffer) {
      await file.save(data, { contentType });
      return;
    }

    const writeStream = file.createWriteStream({
      metadata: { contentType },
    });

    await new Promise<void>((resolve, reject) => {
      (data as Readable).pipe(writeStream);
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });
  }

  async tusDataStore(_redis: RedisClientType): Promise<DataStore> {
    if (!this.tusStore) {
      this.tusStore = new GCSStore({ bucket: this.bucket });
    }

    return this.tusStore;
  }
}
