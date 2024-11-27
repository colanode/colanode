import { initApi } from '@/api';
import { initRedis } from '@/data/redis';
import { migrate } from '@/data/database';
import { jobService } from '@/services/job-service';
import dotenv from 'dotenv';

dotenv.config();

const init = async () => {
  await migrate();
  await initRedis();
  await initApi();

  jobService.initQueue();
  await jobService.initWorker();
};

init();
