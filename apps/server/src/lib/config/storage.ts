import { z } from 'zod/v4';

import { resolveConfigReference } from './utils';

const s3StorageProviderConfigSchema = z.object({
  type: z.literal('s3'),
  endpoint: z
    .string({ error: 'Storage S3 endpoint is required' })
    .transform(resolveConfigReference),
  accessKey: z
    .string({ error: 'Storage S3 access key is required' })
    .transform(resolveConfigReference),
  secretKey: z
    .string({ error: 'Storage S3 secret key is required' })
    .transform(resolveConfigReference),
  bucket: z
    .string({ error: 'Storage S3 bucket is required' })
    .transform(resolveConfigReference),
  region: z.string({ error: 'Storage S3 region is required' }),
  forcePathStyle: z.boolean().optional(),
});

const fileStorageProviderConfigSchema = z.object({
  type: z.literal('file'),
  directory: z
    .string({ error: 'Storage file directory is required' })
    .default('./colanode')
    .transform(resolveConfigReference),
});

const gcsStorageProviderConfigSchema = z.object({
  type: z.literal('gcs'),
  bucket: z
    .string({ error: 'Storage GCS bucket is required' })
    .transform(resolveConfigReference),
  projectId: z
    .string({ error: 'Storage GCS project ID is required' })
    .transform(resolveConfigReference),
  credentials: z
    .string({ error: 'Storage GCS credentials is required' })
    .transform(resolveConfigReference),
});

const azureStorageProviderConfigSchema = z.object({
  type: z.literal('azure'),
  account: z
    .string({ error: 'Storage Azure account is required' })
    .transform(resolveConfigReference),
  accountKey: z
    .string({ error: 'Storage Azure account key is required' })
    .transform(resolveConfigReference),
  containerName: z
    .string({ error: 'Storage Azure container name is required' })
    .transform(resolveConfigReference),
});

export const storageProviderConfigSchema = z
  .discriminatedUnion('type', [
    s3StorageProviderConfigSchema,
    fileStorageProviderConfigSchema,
    gcsStorageProviderConfigSchema,
    azureStorageProviderConfigSchema,
  ])
  .prefault({
    type: 'file',
  });

export const tusLockerSchema = z
  .discriminatedUnion('type', [
    z.object({
      type: z.literal('redis'),
      prefix: z
        .string()
        .default('colanode:tus:lock')
        .transform(resolveConfigReference),
    }),
    z.object({
      type: z.literal('memory'),
    }),
  ])
  .prefault({
    type: 'memory',
  });

export const tusCacheSchema = z
  .discriminatedUnion('type', [
    z.object({ type: z.literal('none') }),
    z.object({
      type: z.literal('redis'),
      prefix: z
        .string()
        .default('colanode:tus:kv')
        .transform(resolveConfigReference),
    }),
  ])
  .prefault({
    type: 'none',
  });

export const tusConfigSchema = z
  .object({
    locker: tusLockerSchema,
    cache: tusCacheSchema,
  })
  .prefault({});

export const storageConfigSchema = z
  .object({
    tus: tusConfigSchema,
    provider: storageProviderConfigSchema,
  })
  .prefault({});

export type TusLockerConfig = z.infer<typeof tusLockerSchema>;
export type TusCacheConfig = z.infer<typeof tusCacheSchema>;
export type TusConfig = z.infer<typeof tusConfigSchema>;

export type StorageProviderConfig = z.infer<typeof storageProviderConfigSchema>;
export type S3StorageProviderConfig = z.infer<
  typeof s3StorageProviderConfigSchema
>;
export type FileStorageProviderConfig = z.infer<
  typeof fileStorageProviderConfigSchema
>;
export type GCSStorageProviderConfig = z.infer<
  typeof gcsStorageProviderConfigSchema
>;
export type AzureStorageProviderConfig = z.infer<
  typeof azureStorageProviderConfigSchema
>;
export type StorageConfig = z.infer<typeof storageConfigSchema>;
