import { z } from 'zod/v4';

import { readAccountConfigFromEnv } from './account';
import { readAiConfigFromEnv } from './ai';
import { readJobsConfigFromEnv } from './jobs';
import { loadRawConfig } from './loader';
import { readLoggingConfigFromEnv } from './logging';
import { readPostgresConfigFromEnv } from './postgres';
import { readRedisConfigFromEnv } from './redis';
import { readServerConfigFromEnv } from './server';
import { readSmtpConfigFromEnv } from './smtp';
import { readStorageConfigFromEnv } from './storage';
import { readUserConfigFromEnv } from './user';
import { readWorkspaceConfigFromEnv } from './workspace';

import { accountConfigSchema } from './account';
import { aiConfigSchema } from './ai';
import { jobsConfigSchema } from './jobs';
import { loggingConfigSchema } from './logging';
import { postgresConfigSchema } from './postgres';
import { redisConfigSchema } from './redis';
import { serverConfigSchema } from './server';
import { smtpConfigSchema } from './smtp';
import { storageConfigSchema } from './storage';
import { userConfigSchema } from './user';
import { workspaceConfigSchema } from './workspace';

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
  logging: loggingConfigSchema,
  workspace: workspaceConfigSchema,
});

export type Configuration = z.infer<typeof configSchema>;

const readConfigVariables = (): Configuration => {
  try {
    // Legacy env-based config (used as override for JSON config)
    const legacyEnvConfig = {
      server: readServerConfigFromEnv(),
      account: readAccountConfigFromEnv(),
      user: readUserConfigFromEnv(),
      postgres: readPostgresConfigFromEnv(),
      redis: readRedisConfigFromEnv(),
      storage: readStorageConfigFromEnv(),
      smtp: readSmtpConfigFromEnv(),
      ai: readAiConfigFromEnv(),
      jobs: readJobsConfigFromEnv(),
      logging: readLoggingConfigFromEnv(),
      workspace: readWorkspaceConfigFromEnv(),
    };

    // Merge JSON config with env config (env takes precedence)
    const input = loadRawConfig(legacyEnvConfig);

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
