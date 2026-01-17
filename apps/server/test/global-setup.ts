import os from 'node:os';
import path from 'node:path';
import { writeFile } from 'node:fs/promises';

import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { RedisContainer } from '@testcontainers/redis';

type TestEnvConfig = {
  POSTGRES_URL: string;
  REDIS_URL: string;
  CONFIG: string;
  NODE_ENV: string;
};

const ENV_PATH = path.join(os.tmpdir(), 'colanode-test-env.json');
const CONFIG_PATH = path.join(os.tmpdir(), 'colanode-test-config.json');

export default async function globalSetup() {
  const postgres = await new PostgreSqlContainer('pgvector/pgvector:pg17')
    .withDatabase('colanode_test')
    .withUsername('postgres')
    .withPassword('postgres')
    .start();

  const redis = await new RedisContainer('redis:7-alpine').start();

  const testConfig = {
    mode: 'standalone',
    logging: { level: 'silent' },
    email: { enabled: false },
    jobs: {
      nodeUpdatesMerge: { enabled: false },
      documentUpdatesMerge: { enabled: false },
      cleanup: { enabled: false },
    },
    storage: {
      tus: { locker: { type: 'memory' }, cache: { type: 'none' } },
      provider: {
        type: 'file',
        directory: path.join(os.tmpdir(), 'colanode-test-storage'),
      },
    },
  };

  await writeFile(CONFIG_PATH, JSON.stringify(testConfig));

  const envConfig: TestEnvConfig = {
    POSTGRES_URL: postgres.getConnectionUri(),
    REDIS_URL: redis.getConnectionUrl(),
    CONFIG: CONFIG_PATH,
    NODE_ENV: 'test',
  };

  await writeFile(ENV_PATH, JSON.stringify(envConfig));

  Object.assign(process.env, envConfig);

  const { migrate, database } = await import('../src/data/database');
  await migrate();
  await database.destroy();

  return async () => {
    await redis.stop();
    await postgres.stop();
  };
}
