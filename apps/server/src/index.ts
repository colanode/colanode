import dotenv from 'dotenv';

import { initApp } from '@colanode/server/app';
import { migrate } from '@colanode/server/data/database';
import { initRedis } from '@colanode/server/data/redis';
import { eventBus } from '@colanode/server/lib/event-bus';
import { emailService } from '@colanode/server/services/email-service';
import { jobService } from '@colanode/server/services/job-service';

dotenv.config({
  quiet: true,
});

const init = async () => {
  await migrate();
  await initRedis();

  initApp();

  jobService.initQueue();
  await jobService.initWorker();

  await eventBus.init();
  await emailService.init();
};

init();
