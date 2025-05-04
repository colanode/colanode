import { z } from 'zod';

export const s3ConfigSchema = z.object({
  endpoint: z.string({ required_error: 'S3_ENDPOINT is required' }),
  accessKey: z.string({ required_error: 'S3_ACCESS_KEY is required' }),
  secretKey: z.string({ required_error: 'S3_SECRET_KEY is required' }),
  bucketName: z.string({ required_error: 'S3_BUCKET_NAME is required' }),
  region: z.string({ required_error: 'S3_REGION is required' }),
});

export type S3Config = z.infer<typeof s3ConfigSchema>;

export const readFilesS3ConfigVariables = () => {
  return {
    endpoint: process.env.S3_FILES_ENDPOINT,
    accessKey: process.env.S3_FILES_ACCESS_KEY,
    secretKey: process.env.S3_FILES_SECRET_KEY,
    bucketName: process.env.S3_FILES_BUCKET_NAME,
    region: process.env.S3_FILES_REGION,
  };
};

export const readAvatarsS3ConfigVariables = () => {
  return {
    endpoint: process.env.S3_AVATARS_ENDPOINT,
    accessKey: process.env.S3_AVATARS_ACCESS_KEY,
    secretKey: process.env.S3_AVATARS_SECRET_KEY,
    bucketName: process.env.S3_AVATARS_BUCKET_NAME,
    region: process.env.S3_AVATARS_REGION,
  };
};
