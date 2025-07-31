import { S3Client, S3ClientConfig } from '@aws-sdk/client-s3';

import { config } from '@colanode/server/lib/config';

export const s3Config: S3ClientConfig = {
  endpoint: config.storage.endpoint,
  region: config.storage.region,
  credentials: {
    accessKeyId: config.storage.accessKey,
    secretAccessKey: config.storage.secretKey,
  },
  forcePathStyle: config.storage.forcePathStyle,
};

export const s3Client = new S3Client(s3Config);
