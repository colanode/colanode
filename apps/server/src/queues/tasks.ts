import { redisConfig } from '@/data/redis';
import { SendEmailTask, Task } from '@/types/tasks';
import { Job, Queue, Worker } from 'bullmq';
import { sendEmail } from '@/services/email';

const taskQueue = new Queue('tasks', {
  connection: {
    host: redisConfig.host,
    password: redisConfig.password,
    port: redisConfig.port,
    db: redisConfig.db,
  },
  defaultJobOptions: {
    removeOnComplete: true,
  },
});

export const enqueueTask = async (task: Task): Promise<void> => {
  await taskQueue.add('task', task);
};

export const initTaskWorker = () => {
  return new Worker('tasks', handleTaskJob, {
    connection: {
      host: redisConfig.host,
      password: redisConfig.password,
      port: redisConfig.port,
      db: redisConfig.db,
    },
  });
};

const handleTaskJob = async (job: Job) => {
  const task = job.data as Task;

  switch (task.type) {
    case 'send_email':
      return handleSendEmailTask(task);
  }
};

const handleSendEmailTask = async (task: SendEmailTask): Promise<void> => {
  await sendEmail(task.message);
};
