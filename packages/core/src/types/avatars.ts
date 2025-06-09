import { z } from 'zod/v4';

export const avatarUploadOutputSchema = z.object({
  success: z.boolean(),
  id: z.string(),
});

export type AvatarUploadOutput = z.infer<typeof avatarUploadOutputSchema>;
