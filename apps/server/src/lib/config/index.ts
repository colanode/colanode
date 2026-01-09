import { z } from 'zod/v4';

import { accountConfigSchema } from './account';
import { aiConfigSchema } from './ai';
import { emailConfigSchema } from './email';
import { jobsConfigSchema } from './jobs';
import { loadRawConfig } from './loader';
import { loggingConfigSchema } from './logging';
import { postgresConfigSchema } from './postgres';
import { redisConfigSchema } from './redis';
import { serverConfigSchema } from './server';
import { storageConfigSchema } from './storage';
import { workspaceConfigSchema } from './workspace';

const configSchema = z.object({
  server: serverConfigSchema,
  account: accountConfigSchema,
  postgres: postgresConfigSchema,
  redis: redisConfigSchema,
  storage: storageConfigSchema,
  email: emailConfigSchema,
  ai: aiConfigSchema,
  jobs: jobsConfigSchema,
  logging: loggingConfigSchema,
  workspace: workspaceConfigSchema,
});

export type Configuration = z.infer<typeof configSchema>;

const readConfigVariables = (): Configuration => {
  try {
    const input = loadRawConfig();
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
