import { z } from 'zod/v4';

export const storageConfigSchema = z.object({
  type: z.literal('s3'),
  endpoint: z.string({ error: 'STORAGE_S3_ENDPOINT is required' }),
  accessKey: z.string({ error: 'STORAGE_S3_ACCESS_KEY is required' }),
  secretKey: z.string({ error: 'STORAGE_S3_SECRET_KEY is required' }),
  bucket: z.string({ error: 'STORAGE_S3_BUCKET is required' }),
  region: z.string({ error: 'STORAGE_S3_REGION is required' }),
  partSize: z
    .number()
    .optional()
    .default(20 * 1024 * 1024), // 20MB
  forcePathStyle: z.boolean().optional(),
});

export type StorageConfig = z.infer<typeof storageConfigSchema>;

export const readStorageConfigVariables = () => {
  return {
    type: 's3',
    endpoint: process.env.STORAGE_S3_ENDPOINT,
    accessKey: process.env.STORAGE_S3_ACCESS_KEY,
    secretKey: process.env.STORAGE_S3_SECRET_KEY,
    bucket: process.env.STORAGE_S3_BUCKET,
    region: process.env.STORAGE_S3_REGION,
    partSize: process.env.STORAGE_S3_PART_SIZE,
    forcePathStyle: process.env.STORAGE_S3_FORCE_PATH_STYLE === 'true',
  };
};
