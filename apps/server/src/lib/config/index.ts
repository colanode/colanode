import { z } from 'zod';

import { accountConfigSchema, readAccountConfigVariables } from './account';
import { aiConfigSchema, readAiConfigVariables } from './ai';
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
