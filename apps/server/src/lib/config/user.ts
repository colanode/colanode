import { z } from 'zod/v4';

export const userConfigSchema = z.object({
  storageLimit: z.string().default('10737418240'),
  maxFileSize: z.string().default('104857600'),
});

export type UserConfig = z.infer<typeof userConfigSchema>;
