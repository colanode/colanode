import dotenv from 'dotenv';

import { eventBus } from '@/lib/event-bus';
import { initApi } from '@/api';
import { migrate } from '@/data/database';
import { initRedis } from '@/data/redis';
import { jobService } from '@/services/job-service';

dotenv.config();

const init = async () => {
  await migrate();
  await initRedis();
  await initApi();

  jobService.initQueue();
  await jobService.initWorker();

  await eventBus.init();
};

init();
