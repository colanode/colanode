import { z } from 'zod';

export const redisConfigSchema = z.object({
  url: z.string({ required_error: 'REDIS_URL is required' }),
  db: z.coerce.number().default(0),
  jobs: z.object({
    name: z.string().optional().default('jobs'),
    prefix: z.string().optional().default('colanode'),
  }),
  eventsChannel: z.string().optional().default('events'),
});

export type RedisConfig = z.infer<typeof redisConfigSchema>;

export const readRedisConfigVariables = () => {
  return {
    url: process.env.REDIS_URL,
    db: process.env.REDIS_DB,
    jobs: {
      name: process.env.REDIS_JOBS_NAME,
      prefix: process.env.REDIS_JOBS_PREFIX,
    },
    eventsChannel: process.env.REDIS_EVENTS_CHANNEL,
  };
};
