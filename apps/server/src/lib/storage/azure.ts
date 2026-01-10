import { Readable } from 'stream';

import {
  BlobServiceClient,
  StorageSharedKeyCredential,
  BlockBlobClient,
} from '@azure/storage-blob';
import { AzureStore } from '@tus/azure-store';
import { DataStore } from '@tus/server';

import { redis } from '@colanode/server/data/redis';
import type {
  AzureStorageProviderConfig,
  TusConfig,
} from '@colanode/server/lib/config/storage';
import { RedisKvStore } from '@colanode/server/lib/storage/tus/redis-kv';

import type { Storage } from './core';

export class AzureBlobStorage implements Storage {
  private readonly containerName: string;
  private readonly blobServiceClient: BlobServiceClient;
  private readonly store: AzureStore;

  constructor(config: AzureStorageProviderConfig, tusConfig: TusConfig) {
    const sharedKeyCredential = new StorageSharedKeyCredential(
      config.account,
      config.accountKey
    );

    this.blobServiceClient = new BlobServiceClient(
      `https://${config.account}.blob.core.windows.net`,
      sharedKeyCredential
    );
    this.containerName = config.containerName;

    this.store = new AzureStore({
      account: config.account,
      accountKey: config.accountKey,
      containerName: this.containerName,
      cache:
        tusConfig.cache.type === 'redis'
          ? new RedisKvStore(redis, tusConfig.cache.prefix)
          : undefined,
    });
  }

  public get tusStore(): DataStore {
    return this.store;
  }

  private getBlockBlobClient(path: string): BlockBlobClient {
    const containerClient = this.blobServiceClient.getContainerClient(
      this.containerName
    );
    return containerClient.getBlockBlobClient(path);
  }

  async download(
    path: string
  ): Promise<{ stream: Readable; contentType?: string }> {
    const containerClient = this.blobServiceClient.getContainerClient(
      this.containerName
    );
    const blobClient = containerClient.getBlobClient(path);
    const downloadResponse = await blobClient.download();

    if (!downloadResponse.readableStreamBody) {
      throw new Error('Failed to download blob: no readable stream body');
    }

    return {
      stream: downloadResponse.readableStreamBody as Readable,
      contentType: downloadResponse.contentType,
    };
  }

  async delete(path: string): Promise<void> {
    const containerClient = this.blobServiceClient.getContainerClient(
      this.containerName
    );
    const blobClient = containerClient.getBlobClient(path);
    await blobClient.delete();
  }

  async upload(
    path: string,
    data: Buffer | Readable,
    contentType: string,
    contentLength?: bigint
  ): Promise<void> {
    const blockBlobClient = this.getBlockBlobClient(path);

    if (data instanceof Buffer) {
      await blockBlobClient.upload(data, data.length, {
        blobHTTPHeaders: {
          blobContentType: contentType,
        },
      });
      return;
    }

    if (!contentLength) {
      throw new Error(
        'Content length is required for stream uploads to Azure Blob Storage'
      );
    }

    await blockBlobClient.uploadStream(data as Readable, undefined, undefined, {
      blobHTTPHeaders: {
        blobContentType: contentType,
      },
    });
  }
}
