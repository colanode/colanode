import { z } from 'zod/v4';

import { build } from '@colanode/core';

const serverModeSchema = z.enum(['standalone', 'cluster']);
export type ServerMode = z.infer<typeof serverModeSchema>;

export const serverConfigSchema = z.object({
  version: z.string().default(build.version),
  sha: z.string().default(build.sha),
  name: z.string().default('Colanode Server'),
  avatar: z.string().optional(),
  mode: serverModeSchema.default('standalone'),
  pathPrefix: z.string().optional(),
  cors: z.object({
    origin: z.string().default('http://localhost:4000'),
    maxAge: z.coerce.number().default(7200),
  }),
});

export type ServerConfig = z.infer<typeof serverConfigSchema>;
