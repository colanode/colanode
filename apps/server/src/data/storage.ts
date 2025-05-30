import { S3Client } from '@aws-sdk/client-s3';

import { config } from '@colanode/server/lib/config';

export const s3Client = new S3Client({
  endpoint: config.storage.endpoint,
  region: config.storage.region,
  credentials: {
    accessKeyId: config.storage.accessKey,
    secretAccessKey: config.storage.secretKey,
  },
});
