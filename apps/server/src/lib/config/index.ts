import fs from 'fs';

import { z } from 'zod/v4';

import { accountConfigSchema } from './account';
import { aiConfigSchema } from './ai';
import { corsSchema } from './cors';
import { emailConfigSchema } from './email';
import { jobsConfigSchema } from './jobs';
import { loggingConfigSchema } from './logging';
import { postgresConfigSchema } from './postgres';
import { redisConfigSchema } from './redis';
import { storageConfigSchema } from './storage';
import {
  resolveConfigReference,
  resolveOptionalConfigReference,
} from './utils';
import { workspaceConfigSchema } from './workspace';

const serverModeSchema = z.enum(['standalone', 'cluster']);

const configSchema = z.object({
  name: z.string().default('Colanode Server').transform(resolveConfigReference),
  avatar: z.string().optional().transform(resolveOptionalConfigReference),
  web: z
    .object({
      domain: z.string().transform(resolveConfigReference),
      protocol: z.string().default('https').transform(resolveConfigReference),
    })
    .optional(),
  mode: serverModeSchema
    .default('standalone')
    .transform(resolveConfigReference),
  pathPrefix: z.string().optional().transform(resolveOptionalConfigReference),
  cors: corsSchema,
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

const loadConfigFromPath = (configPath: string): Partial<Configuration> => {
  if (!fs.existsSync(configPath)) {
    throw new Error(`Configuration file not found: ${configPath}`);
  }

  const raw = fs.readFileSync(configPath, 'utf-8');
  const parsed = JSON.parse(raw);
  return parsed;
};

const buildConfig = (): Configuration => {
  try {
    const configPath = process.env.CONFIG;
    const input = configPath ? loadConfigFromPath(configPath) : {};
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

export const config = buildConfig();
