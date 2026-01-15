import { z } from 'zod/v4';

import { resolveConfigReference } from './utils';

export const redisConfigSchema = z
  .object({
    url: z
      .string({ error: 'Redis URL is required' })
      .default('env://REDIS_URL')
      .transform(resolveConfigReference),
    db: z.coerce.number().default(0),
    eventsChannel: z.string().optional().default('events'),
  })
  .prefault({});

export type RedisConfig = z.infer<typeof redisConfigSchema>;
