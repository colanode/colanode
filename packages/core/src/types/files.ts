import { z } from 'zod/v4';

export const fileSubtypeSchema = z.enum([
  'image',
  'video',
  'audio',
  'pdf',
  'other',
]);

export type FileSubtype = z.infer<typeof fileSubtypeSchema>;

export enum FileStatus {
  Pending = 0,
  Ready = 1,
  Error = 2,
}

export const FILE_UPLOAD_PART_SIZE = 20 * 1024 * 1024; // 20MB
