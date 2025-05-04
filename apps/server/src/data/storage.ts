import { S3Client } from '@aws-sdk/client-s3';

import { config } from '@/lib/config';

export const avatarS3 = new S3Client({
  endpoint: config.avatarS3.endpoint,
  region: config.avatarS3.region,
  credentials: {
    accessKeyId: config.avatarS3.accessKey,
    secretAccessKey: config.avatarS3.secretKey,
  },
});

export const fileS3 = new S3Client({
  endpoint: config.fileS3.endpoint,
  region: config.fileS3.region,
  credentials: {
    accessKeyId: config.fileS3.accessKey,
    secretAccessKey: config.fileS3.secretKey,
  },
});
