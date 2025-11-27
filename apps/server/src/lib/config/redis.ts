import { z } from 'zod/v4';

export const redisConfigSchema = z.object({
  url: z.string({ error: 'REDIS_URL is required' }),
  db: z.coerce.number().default(0),
  jobs: z.object({
    name: z.string().optional().default('jobs'),
    prefix: z.string().optional().default('colanode'),
  }),
  tus: z.object({
    lockPrefix: z.string().optional().default('colanode:tus:lock'),
    kvPrefix: z.string().optional().default('colanode:tus:kv'),
  }),
  eventsChannel: z.string().optional().default('events'),
});

export type RedisConfig = z.infer<typeof redisConfigSchema>;
