import { z } from 'zod/v4';

const s3StorageConfigSchema = z.object({
  type: z.literal('s3'),
  endpoint: z.string({ error: 'STORAGE_S3_ENDPOINT is required' }),
  accessKey: z.string({ error: 'STORAGE_S3_ACCESS_KEY is required' }),
  secretKey: z.string({ error: 'STORAGE_S3_SECRET_KEY is required' }),
  bucket: z.string({ error: 'STORAGE_S3_BUCKET is required' }),
  region: z.string({ error: 'STORAGE_S3_REGION is required' }),
  forcePathStyle: z.boolean().optional(),
});

const fileStorageConfigSchema = z.object({
  type: z.literal('file'),
  directory: z.string({ error: 'STORAGE_FILE_DIRECTORY is required' }),
});

const gcsStorageConfigSchema = z.object({
  type: z.literal('gcs'),
  bucket: z.string({ error: 'STORAGE_GCS_BUCKET is required' }),
  projectId: z.string({ error: 'STORAGE_GCS_PROJECT_ID is required' }),
  credentials: z.string({ error: 'STORAGE_GCS_CREDENTIALS is required' }),
});

const azureStorageConfigSchema = z.object({
  type: z.literal('azure'),
  account: z.string({ error: 'STORAGE_AZURE_ACCOUNT is required' }),
  accountKey: z.string({ error: 'STORAGE_AZURE_ACCOUNT_KEY is required' }),
  containerName: z.string({
    error: 'STORAGE_AZURE_CONTAINER_NAME is required',
  }),
});

export const storageConfigSchema = z.discriminatedUnion('type', [
  s3StorageConfigSchema,
  fileStorageConfigSchema,
  gcsStorageConfigSchema,
  azureStorageConfigSchema,
]);

export type StorageConfig = z.infer<typeof storageConfigSchema>;
export type S3StorageConfig = z.infer<typeof s3StorageConfigSchema>;
export type FileStorageConfig = z.infer<typeof fileStorageConfigSchema>;
export type GCSStorageConfig = z.infer<typeof gcsStorageConfigSchema>;
export type AzureStorageConfig = z.infer<typeof azureStorageConfigSchema>;

export const readStorageConfigFromEnv = () => {
  return {
    type: process.env.STORAGE_TYPE as StorageConfig['type'] | undefined,
    // S3 fields
    endpoint: process.env.STORAGE_S3_ENDPOINT,
    accessKey: process.env.STORAGE_S3_ACCESS_KEY,
    secretKey: process.env.STORAGE_S3_SECRET_KEY,
    bucket: process.env.STORAGE_S3_BUCKET,
    region: process.env.STORAGE_S3_REGION,
    forcePathStyle:
      process.env.STORAGE_S3_FORCE_PATH_STYLE === 'true'
        ? true
        : process.env.STORAGE_S3_FORCE_PATH_STYLE === 'false'
          ? false
          : undefined,
    // File storage fields
    directory: process.env.STORAGE_FILE_DIRECTORY,
    // GCS fields
    projectId: process.env.STORAGE_GCS_PROJECT_ID,
    credentials: process.env.STORAGE_GCS_CREDENTIALS,
    // Azure fields
    account: process.env.STORAGE_AZURE_ACCOUNT,
    accountKey: process.env.STORAGE_AZURE_ACCOUNT_KEY,
    containerName: process.env.STORAGE_AZURE_CONTAINER_NAME,
  };
};
