import { z } from 'zod';

export const fileUploadOutputSchema = z.object({
  success: z.boolean(),
  uploadId: z.string(),
});

export type FileUploadOutput = z.infer<typeof fileUploadOutputSchema>;

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
