import { z } from 'zod';

import { build } from '@colanode/core';

const serverModeSchema = z.enum(['standalone', 'cluster']);
export type ServerMode = z.infer<typeof serverModeSchema>;

export const serverConfigSchema = z.object({
  version: z.string().default(build.version),
  sha: z.string().default(build.sha),
  name: z.string().default('Colanode Server'),
  avatar: z.string().optional(),
  mode: serverModeSchema.default('standalone'),
  cors: z.object({
    origin: z.string().default('https://app.colanode.com'),
    maxAge: z.number().default(7200),
  }),
});

export type ServerConfig = z.infer<typeof serverConfigSchema>;

export const readServerConfigVariables = () => {
  return {
    version: build.version,
    sha: build.sha,
    name: process.env.SERVER_NAME,
    avatar: process.env.SERVER_AVATAR,
    mode: process.env.SERVER_MODE,
    cors: {
      origin: process.env.SERVER_CORS_ORIGIN,
      maxAge: process.env.SERVER_CORS_MAX_AGE,
    },
  };
};
