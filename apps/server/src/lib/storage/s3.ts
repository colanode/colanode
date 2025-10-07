import { Readable } from 'stream';

import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { RedisClientType } from '@redis/client';
import { FILE_UPLOAD_PART_SIZE } from '@colanode/core';
import { DataStore } from '@tus/server';
import { S3Store } from '@tus/s3-store';

import { config } from '@colanode/server/lib/config';
import { RedisKvStore } from '@colanode/server/lib/tus/redis-kv';

import type { Storage } from './core';

interface S3StorageConfig {
  endpoint: string;
  accessKey: string;
  secretKey: string;
  bucket: string;
  region: string;
  forcePathStyle?: boolean;
}

export class S3Storage implements Storage {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly config: S3StorageConfig;
  private tusStore: DataStore | null = null;

  constructor(config: S3StorageConfig) {
    this.config = { ...config };
    this.client = new S3Client({
      endpoint: this.config.endpoint,
      region: this.config.region,
      credentials: {
        accessKeyId: this.config.accessKey,
        secretAccessKey: this.config.secretKey,
      },
      forcePathStyle: this.config.forcePathStyle,
    });

    this.bucket = this.config.bucket;
  }

  async download(
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

  async delete(path: string): Promise<void> {
    const command = new DeleteObjectCommand({ Bucket: this.bucket, Key: path });
    await this.client.send(command);
  }

  async upload(
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

  async tusDataStore(redis: RedisClientType): Promise<DataStore> {
    if (this.tusStore) {
      return this.tusStore;
    }

    this.tusStore = new S3Store({
      partSize: FILE_UPLOAD_PART_SIZE,
      cache: new RedisKvStore(redis, config.redis.tus.kvPrefix),
      s3ClientConfig: {
        bucket: this.bucket,
        endpoint: this.config.endpoint,
        region: this.config.region,
        forcePathStyle: this.config.forcePathStyle,
        credentials: {
          accessKeyId: this.config.accessKey,
          secretAccessKey: this.config.secretKey,
        },
      },
    });

    return this.tusStore;
  }
}
