import { DataStore } from '@tus/server';
import { FILE_UPLOAD_PART_SIZE } from '@colanode/core';
import { RedisClientType } from '@redis/client';
import { config } from '@colanode/server/lib/config';
import { RedisKvStore } from '@colanode/server/lib/tus/redis-kv';
import { S3Store } from '@tus/s3-store';
import { FileStore } from '@tus/file-store';
import { GCSStore } from '@tus/gcs-store';
import { Storage } from '@google-cloud/storage';
import { AzureStore } from '@tus/azure-store';

export const createTusStore = async (
  redis: RedisClientType
): Promise<DataStore> => {
  const storageConfig = config.storage;

  switch (storageConfig.type) {
    case 's3': {
      return new S3Store({
        partSize: FILE_UPLOAD_PART_SIZE,
        cache: new RedisKvStore(redis, config.redis.tus.kvPrefix),
        s3ClientConfig: {
          endpoint: storageConfig.endpoint,
          region: storageConfig.region,
          credentials: {
            accessKeyId: storageConfig.accessKey,
            secretAccessKey: storageConfig.secretKey,
          },
          forcePathStyle: storageConfig.forcePathStyle,
          bucket: storageConfig.bucket,
        },
      });
    }
    case 'file': {
      return new FileStore({
        directory: storageConfig.directory,
      });
    }
    case 'gcs': {
      const storage = new Storage({
        projectId: storageConfig.projectId,
        keyFilename: storageConfig.credentials,
      });

      const bucket = storage.bucket(storageConfig.bucket);

      return new GCSStore({ bucket: bucket });
    }
    case 'azure': {
      return new AzureStore({
        account: storageConfig.account,
        accountKey: storageConfig.accountKey,
        containerName: storageConfig.containerName,
      });
    }
    default:
      throw new Error(`Unsupported storage type.`);
  }
};
