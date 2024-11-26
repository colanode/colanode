import { initApi } from '@/api';
import { initRedis } from '@/data/redis';
import { migrate } from '@/data/database';
import { initTaskWorker } from '@/queues/tasks';
import dotenv from 'dotenv';

dotenv.config();

const init = async () => {
  await migrate();
  await initRedis();
  await initApi();

  initTaskWorker();
};

init();
