import { z } from 'zod/v4';

export const serverConfigSchema = z.object({
  name: z.string(),
  avatar: z.string(),
  version: z.string(),
  sha: z.string(),
  ip: z.string().nullable().optional(),
  pathPrefix: z.string().nullable().optional(),
});

export type ServerConfig = z.infer<typeof serverConfigSchema>;
