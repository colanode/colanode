import { z } from 'zod';

import { accountConfigSchema, readAccountConfigVariables } from './account';
import { readServerConfigVariables, serverConfigSchema } from './server';
import { readUserConfigVariables, userConfigSchema } from './user';
import { postgresConfigSchema, readPostgresConfigVariables } from './postgres';
import {
  readAvatarsS3ConfigVariables,
  readFilesS3ConfigVariables,
  s3ConfigSchema,
} from './s3';
import { aiConfigSchema, readAiConfigVariables } from './ai';
import { readSmtpConfigVariables, smtpConfigSchema } from './smtp';
import { readRedisConfigVariables, redisConfigSchema } from './redis';

const configSchema = z.object({
  server: serverConfigSchema,
  account: accountConfigSchema,
  user: userConfigSchema,
  postgres: postgresConfigSchema,
  redis: redisConfigSchema,
  avatarS3: s3ConfigSchema,
  fileS3: s3ConfigSchema,
  smtp: smtpConfigSchema,
  ai: aiConfigSchema,
});

export type Configuration = z.infer<typeof configSchema>;

const readConfigVariables = (): Configuration => {
  try {
    const input = {
      server: readServerConfigVariables(),
      account: readAccountConfigVariables(),
      user: readUserConfigVariables(),
      postgres: readPostgresConfigVariables(),
      redis: readRedisConfigVariables(),
      avatarS3: readAvatarsS3ConfigVariables(),
      fileS3: readFilesS3ConfigVariables(),
      smtp: readSmtpConfigVariables(),
      ai: readAiConfigVariables(),
    };

    return configSchema.parse(input);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Configuration validation error:');
      error.errors.forEach((err) => {
        console.error(`- ${err.path.join('.')}: ${err.message}`);
      });
    } else {
      console.error('Configuration validation error:', error);
    }

    process.exit(1);
  }
};

export const config = readConfigVariables();
