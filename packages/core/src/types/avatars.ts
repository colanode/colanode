import { z } from 'zod';

export const avatarUploadOutputSchema = z.object({
  success: z.boolean(),
  id: z.string(),
});

export type AvatarUploadOutput = z.infer<typeof avatarUploadOutputSchema>;
