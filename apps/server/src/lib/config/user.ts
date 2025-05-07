import { z } from 'zod';

export const userConfigSchema = z.object({
  storageLimit: z.string().default('10737418240'),
  maxFileSize: z.string().default('104857600'),
});

export type UserConfig = z.infer<typeof userConfigSchema>;

export const readUserConfigVariables = () => {
  return {
    storageLimit: process.env.USER_STORAGE_LIMIT,
    maxFileSize: process.env.USER_MAX_FILE_SIZE,
  };
};
