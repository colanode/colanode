import { z } from 'zod';

export const createUploadInputSchema = z.object({
  fileId: z.string(),
});

export type CreateUploadInput = z.infer<typeof createUploadInputSchema>;

export const createUploadOutputSchema = z.object({
  url: z.string(),
  uploadId: z.string(),
});

export type CreateUploadOutput = z.infer<typeof createUploadOutputSchema>;

export const createDownloadOutputSchema = z.object({
  url: z.string(),
});

export type CreateDownloadOutput = z.infer<typeof createDownloadOutputSchema>;

export const completeUploadInputSchema = z.object({
  uploadId: z.string(),
});

export type CompleteUploadInput = z.infer<typeof completeUploadInputSchema>;

export const completeUploadOutputSchema = z.object({
  success: z.boolean(),
});

export type CompleteUploadOutput = z.infer<typeof completeUploadOutputSchema>;

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
