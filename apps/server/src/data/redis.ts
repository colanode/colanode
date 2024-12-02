import { createClient } from 'redis';

const REDIS_URL = process.env.REDIS_URL || '';
const REDIS_HOST = process.env.REDIS_HOST;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;
const REDIS_PORT = process.env.REDIS_PORT;
const REDIS_DB = process.env.REDIS_DB;

if (!REDIS_URL || !REDIS_HOST || !REDIS_PASSWORD || !REDIS_PORT || !REDIS_DB) {
  throw new Error('Redis configuration is missing');
}

export const redisConfig = {
  url: REDIS_URL,
  host: REDIS_HOST,
  password: REDIS_PASSWORD,
  port: parseInt(REDIS_PORT),
  db: parseInt(REDIS_DB),
};

export const redis = createClient({
  url: REDIS_URL,
});

export const initRedis = async () => {
  await redis.connect();

  redis.on('error', (err) => {
    console.error('Redis client error:', err);
  });
};
