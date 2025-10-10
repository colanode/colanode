import { Readable } from 'stream';

import { DataStore } from '@tus/server';
import { AzureStore } from '@tus/azure-store';
import {
  BlobServiceClient,
  StorageSharedKeyCredential,
  BlockBlobClient,
} from '@azure/storage-blob';
import type { AzureStorageConfig } from '@colanode/server/lib/config/storage';

import type { Storage } from './core';

export class AzureBlobStorage implements Storage {
  private readonly containerName: string;
  private readonly blobServiceClient: BlobServiceClient;
  private readonly config: AzureStorageConfig;
  public readonly tusStore: DataStore;

  constructor(config: AzureStorageConfig) {
    this.config = { ...config };
    const sharedKeyCredential = new StorageSharedKeyCredential(
      this.config.account,
      this.config.accountKey
    );

    this.blobServiceClient = new BlobServiceClient(
      `https://${this.config.account}.blob.core.windows.net`,
      sharedKeyCredential
    );
    this.containerName = this.config.containerName;

    this.tusStore = new AzureStore({
      account: this.config.account,
      accountKey: this.config.accountKey,
      containerName: this.containerName,
    });
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
