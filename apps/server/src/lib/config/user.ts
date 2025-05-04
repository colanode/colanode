import { z } from 'zod';

export const userConfigSchema = z.object({
  storageLimit: z.preprocess(
    (val) => val && BigInt(val as string),
    z.bigint().default(10737418240n)
  ),
  maxFileSize: z.preprocess(
    (val) => val && BigInt(val as string),
    z.bigint().default(104857600n)
  ),
});

export type UserConfig = z.infer<typeof userConfigSchema>;

export const readUserConfigVariables = () => {
  return {
    storageLimit: process.env.USER_STORAGE_LIMIT,
    maxFileSize: process.env.USER_MAX_FILE_SIZE,
  };
};
