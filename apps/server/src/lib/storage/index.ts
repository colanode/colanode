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
      return new FileSystemStorage({
        directory: storageConfig.directory,
      });
    case 's3':
      return new S3Storage({
        endpoint: storageConfig.endpoint,
        accessKey: storageConfig.accessKey,
        secretKey: storageConfig.secretKey,
        bucket: storageConfig.bucket,
        region: storageConfig.region,
        forcePathStyle: storageConfig.forcePathStyle,
      });
    case 'gcs':
      return new GCSStorage({
        bucket: storageConfig.bucket,
        projectId: storageConfig.projectId,
        credentials: storageConfig.credentials,
      });
    case 'azure':
      return new AzureBlobStorage({
        account: storageConfig.account,
        accountKey: storageConfig.accountKey,
        containerName: storageConfig.containerName,
      });
    default:
      throw new Error(`Unsupported storage type: ${(storageConfig as any).type}`);
  }
};

export const storage = buildStorage(config.storage);

export type { Storage } from './core';
