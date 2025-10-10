import { config } from '@colanode/server/lib/config';

import type { StorageConfig } from '../config/storage';

import type { Storage } from './core';
import { AzureBlobStorage } from './azure';
import { FileSystemStorage } from './fs';
import { GCSStorage } from './gcs';
import { S3Storage } from './s3';

const buildStorage = (storageConfig: StorageConfig): Storage => {
  switch (storageConfig.type) {
    case 'file':
      return new FileSystemStorage(storageConfig);
    case 's3':
      return new S3Storage(storageConfig);
    case 'gcs':
      return new GCSStorage(storageConfig);
    case 'azure':
      return new AzureBlobStorage(storageConfig);
    default:
      throw new Error(
        `Unsupported storage type: ${(storageConfig as any).type}`
      );
  }
};

export const storage = buildStorage(config.storage);

export type { Storage } from './core';
