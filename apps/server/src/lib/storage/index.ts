import { config } from '@colanode/server/lib/config';
import type { StorageConfig } from '@colanode/server/lib/config/storage';

import { AzureBlobStorage } from './azure';
import type { Storage } from './core';
import { FileSystemStorage } from './fs';
import { GCSStorage } from './gcs';
import { S3Storage } from './s3';

const buildStorage = (config: StorageConfig): Storage => {
  switch (config.provider.type) {
    case 'file':
      return new FileSystemStorage(config.provider, config.tus);
    case 's3':
      return new S3Storage(config.provider, config.tus);
    case 'gcs':
      return new GCSStorage(config.provider);
    case 'azure':
      return new AzureBlobStorage(config.provider, config.tus);
    default:
      throw new Error(
        `Unsupported storage provider: ${JSON.stringify(config.provider)}`
      );
  }
};

export const storage = buildStorage(config.storage);

export type { Storage } from './core';
