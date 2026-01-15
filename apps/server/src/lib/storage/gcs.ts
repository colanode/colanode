import { Readable } from 'stream';

import { Storage as GoogleStorage, Bucket, File } from '@google-cloud/storage';
import { GCSStore } from '@tus/gcs-store';
import { DataStore } from '@tus/server';

import type { GCSStorageProviderConfig } from '@colanode/server/lib/config/storage';

import type { Storage } from './core';

export class GCSStorage implements Storage {
  private readonly bucket: Bucket;
  private readonly gcsStore: GCSStore;

  constructor(config: GCSStorageProviderConfig) {
    const storage = new GoogleStorage({
      projectId: config.projectId,
      keyFilename: config.credentials,
    });

    this.bucket = storage.bucket(config.bucket);
    this.gcsStore = new GCSStore({ bucket: this.bucket });
  }

  public get tusStore(): DataStore {
    return this.gcsStore;
  }

  private getFile(path: string): File {
    return this.bucket.file(path);
  }

  public async download(
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

  public async delete(path: string): Promise<void> {
    const file = this.getFile(path);
    await file.delete();
  }

  public async upload(
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
}
