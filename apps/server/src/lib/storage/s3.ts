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
import { RedisKvStore } from '@colanode/server/lib/storage/tus/redis-kv';
import type { S3StorageConfig } from '@colanode/server/lib/config/storage';
import { redis } from '@colanode/server/data/redis';
import type { Storage } from './core';

export class S3Storage implements Storage {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly s3Config: S3StorageConfig;
  public readonly tusStore: DataStore;

  constructor(s3Config: S3StorageConfig) {
    this.s3Config = { ...s3Config };
    this.client = new S3Client({
      endpoint: this.s3Config.endpoint,
      region: this.s3Config.region,
      credentials: {
        accessKeyId: this.s3Config.accessKey,
        secretAccessKey: this.s3Config.secretKey,
      },
      forcePathStyle: this.s3Config.forcePathStyle,
    });

    this.bucket = this.s3Config.bucket;

    this.tusStore = new S3Store({
      partSize: FILE_UPLOAD_PART_SIZE,
      cache: new RedisKvStore(redis, config.redis.tus.kvPrefix),
      s3ClientConfig: {
        bucket: this.bucket,
        endpoint: this.s3Config.endpoint,
        region: this.s3Config.region,
        forcePathStyle: this.s3Config.forcePathStyle,
        credentials: {
          accessKeyId: this.s3Config.accessKey,
          secretAccessKey: this.s3Config.secretKey,
        },
      },
    });
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
}
