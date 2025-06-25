import { z } from 'zod/v4';

import { accountConfigSchema, readAccountConfigVariables } from './account';
import { aiConfigSchema, readAiConfigVariables } from './ai';
import { jobsConfigSchema, readJobsConfigVariables } from './jobs';
import { postgresConfigSchema, readPostgresConfigVariables } from './postgres';
import { readRedisConfigVariables, redisConfigSchema } from './redis';
import { readServerConfigVariables, serverConfigSchema } from './server';
import { readSmtpConfigVariables, smtpConfigSchema } from './smtp';
import { readStorageConfigVariables, storageConfigSchema } from './storage';
import { readUserConfigVariables, userConfigSchema } from './user';

const configSchema = z.object({
  server: serverConfigSchema,
  account: accountConfigSchema,
  user: userConfigSchema,
  postgres: postgresConfigSchema,
  redis: redisConfigSchema,
  storage: storageConfigSchema,
  smtp: smtpConfigSchema,
  ai: aiConfigSchema,
  jobs: jobsConfigSchema,
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
      storage: readStorageConfigVariables(),
      smtp: readSmtpConfigVariables(),
      ai: readAiConfigVariables(),
      jobs: readJobsConfigVariables(),
    };

    return configSchema.parse(input);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Configuration validation error:');
      error.issues.forEach((issue) => {
        console.error(`- ${issue.path.join('.')}: ${issue.message}`);
      });
    } else {
      console.error('Configuration validation error:', error);
    }

    process.exit(1);
  }
};

export const config = readConfigVariables();
