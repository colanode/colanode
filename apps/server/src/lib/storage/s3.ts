import { Readable } from 'stream';

import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { MetadataValue, S3Store } from '@tus/s3-store';
import { DataStore } from '@tus/server';

import { FILE_UPLOAD_PART_SIZE } from '@colanode/core';
import { redis } from '@colanode/server/data/redis';
import type {
  S3StorageProviderConfig,
  TusConfig,
} from '@colanode/server/lib/config/storage';
import { RedisKvStore } from '@colanode/server/lib/storage/tus/redis-kv';

import type { Storage } from './core';

export class S3Storage implements Storage {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly store: DataStore;
  private readonly cache?: RedisKvStore<MetadataValue>;

  constructor(config: S3StorageProviderConfig, tusConfig: TusConfig) {
    this.client = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      credentials: {
        accessKeyId: config.accessKey,
        secretAccessKey: config.secretKey,
      },
      forcePathStyle: config.forcePathStyle,
    });

    this.bucket = config.bucket;

    if (tusConfig.cache.type === 'redis') {
      this.cache = new RedisKvStore(redis, tusConfig.cache.prefix);
    }

    this.store = new S3Store({
      partSize: FILE_UPLOAD_PART_SIZE,
      cache: this.cache,
      s3ClientConfig: {
        bucket: this.bucket,
        endpoint: config.endpoint,
        region: config.region,
        forcePathStyle: config.forcePathStyle,
        credentials: {
          accessKeyId: config.accessKey,
          secretAccessKey: config.secretKey,
        },
      },
    });
  }

  public get tusStore(): DataStore {
    return this.store;
  }

  public async download(
    path: string
  ): Promise<{ stream: Readable; contentType?: string }> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: path });
    const response = await this.client.send(command);

    if (!response.Body || !(response.Body instanceof Readable)) {
      throw new Error('File not found or invalid response body');
    }

    return {
      stream: response.Body,
      contentType: response.ContentType,
    };
  }

  public async delete(path: string): Promise<void> {
    const command = new DeleteObjectCommand({ Bucket: this.bucket, Key: path });
    await this.client.send(command);

    if (this.cache) {
      await this.cache.delete(path);

      const infoPath = `${path}.info`;
      await this.cache.delete(infoPath);
    }
  }

  public async upload(
    path: string,
    data: Buffer | Readable,
    contentType: string,
    contentLength?: bigint
  ): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: path,
      Body: data,
      ContentType: contentType,
      ContentLength: contentLength ? Number(contentLength) : undefined,
    });

    await this.client.send(command);
  }
}
