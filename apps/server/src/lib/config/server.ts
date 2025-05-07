import { z } from 'zod';

import fs from 'fs';

const serverModeSchema = z.enum(['standalone', 'cluster']);
export type ServerMode = z.infer<typeof serverModeSchema>;

const buildInfoSchema = z.object({
  version: z.string(),
  sha: z.string(),
});

export type BuildInfo = z.infer<typeof buildInfoSchema>;

const parseBuildInfo = (): BuildInfo => {
  const defaultBuildInfo: BuildInfo = {
    version: 'dev',
    sha: 'dev',
  };

  if (!fs.existsSync('/app/build.json')) {
    return defaultBuildInfo;
  }

  const json = fs.readFileSync('/app/build.json', 'utf8');
  if (!json || json.length === 0) {
    return defaultBuildInfo;
  }

  try {
    return buildInfoSchema.parse(JSON.parse(json));
  } catch (error) {
    console.error('Failed to parse build info:', error);
    return defaultBuildInfo;
  }
};

export const serverConfigSchema = z.object({
  version: z.string().default('dev'),
  sha: z.string().default('dev'),
  name: z.string().default('Colanode Server'),
  avatar: z.string().optional(),
  mode: serverModeSchema.default('standalone'),
});

export type ServerConfig = z.infer<typeof serverConfigSchema>;

export const readServerConfigVariables = () => {
  const buildInfo = parseBuildInfo();

  return {
    version: buildInfo.version,
    sha: buildInfo.sha,
    name: process.env.SERVER_NAME,
    avatar: process.env.SERVER_AVATAR,
    mode: process.env.SERVER_MODE,
  };
};
