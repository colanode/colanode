import { z } from 'zod/v4';

export const serverGoogleConfigSchema = z.discriminatedUnion('enabled', [
  z.object({
    enabled: z.literal(true),
    clientId: z.string(),
  }),
  z.object({
    enabled: z.literal(false),
  }),
]);

export const serverAccountConfigSchema = z.object({
  google: serverGoogleConfigSchema,
});

export const serverConfigSchema = z.object({
  name: z.string(),
  avatar: z.string(),
  version: z.string(),
  sha: z.string(),
  ip: z.string().nullable().optional(),
  pathPrefix: z.string().nullable().optional(),
  account: serverAccountConfigSchema.nullable().optional(),
});

export type ServerConfig = z.infer<typeof serverConfigSchema>;
