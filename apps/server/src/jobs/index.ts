import { cleanWorkspaceDataHandler } from '@/jobs/clean-workspace-data';
import { sendEmailHandler } from '@/jobs/send-email';
import { JobHandler , JobMap } from '@/types/jobs';

type JobHandlerMap = {
  [K in keyof JobMap]: JobHandler<JobMap[K]['input']>;
};

export const jobHandlerMap: JobHandlerMap = {
  send_email: sendEmailHandler,
  clean_workspace_data: cleanWorkspaceDataHandler,
};
