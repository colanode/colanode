import { z } from 'zod/v4';

export const storageConfigSchema = z.object({
  type: z.literal('s3'),
  endpoint: z.string({ error: 'S3_ENDPOINT is required' }),
  accessKey: z.string({ error: 'S3_ACCESS_KEY is required' }),
  secretKey: z.string({ error: 'S3_SECRET_KEY is required' }),
  bucketName: z.string({ error: 'S3_BUCKET_NAME is required' }),
  region: z.string({ error: 'S3_REGION is required' }),
});

export type StorageConfig = z.infer<typeof storageConfigSchema>;

export const readStorageConfigVariables = () => {
  return {
    type: 's3',
    endpoint: process.env.STORAGE_S3_ENDPOINT,
    accessKey: process.env.STORAGE_S3_ACCESS_KEY,
    secretKey: process.env.STORAGE_S3_SECRET_KEY,
    bucketName: process.env.STORAGE_S3_BUCKET_NAME,
    region: process.env.STORAGE_S3_REGION,
  };
};
