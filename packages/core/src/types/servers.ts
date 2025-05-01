import { z } from 'zod';

export const serverAttributesSchema = z.record(z.string(), z.unknown());

export type ServerAttributes = z.infer<typeof serverAttributesSchema>;

export const serverConfigSchema = z.object({
  name: z.string(),
  avatar: z.string(),
  version: z.string(),
  sha: z.string(),
  ip: z.string().nullable().optional(),
  attributes: serverAttributesSchema,
});

export type ServerConfig = z.infer<typeof serverConfigSchema>;
