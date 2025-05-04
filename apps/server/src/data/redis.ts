import { createClient } from 'redis';

import { config } from '@/lib/config';

export const redis = createClient({
  url: config.redis.url,
  database: config.redis.db,
});

export const initRedis = async () => {
  await redis.connect();

  redis.on('error', (err) => {
    console.error('Redis client error:', err);
  });
};
