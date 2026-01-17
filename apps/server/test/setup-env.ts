import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterAll, beforeAll } from 'vitest';

type TestEnvConfig = {
  POSTGRES_URL: string;
  REDIS_URL: string;
  CONFIG: string;
  NODE_ENV: string;
};

const ENV_PATH = path.join(os.tmpdir(), 'colanode-test-env.json');

if (!fs.existsSync(ENV_PATH)) {
  throw new Error(`Test env file not found at ${ENV_PATH}`);
}

const envConfig = JSON.parse(
  fs.readFileSync(ENV_PATH, 'utf-8')
) as TestEnvConfig;

Object.assign(process.env, envConfig);

let redis: typeof import('../src/data/redis').redis | null = null;
let database: typeof import('../src/data/database').database | null = null;

beforeAll(async () => {
  const redisModule = await import('../src/data/redis');
  await redisModule.initRedis();
  redis = redisModule.redis;

  const dbModule = await import('../src/data/database');
  database = dbModule.database;
});

afterAll(async () => {
  if (redis) {
    await redis.quit();
  }

  if (database) {
    await database.destroy();
  }
});
