import { JobHandler } from '@/types/jobs';
import { JobMap } from '@/types/jobs';

import { sendEmailHandler } from '@/jobs/send-email';
import { cleanWorkspaceDataHandler } from '@/jobs/clean-workspace-data';

type JobHandlerMap = {
  [K in keyof JobMap]: JobHandler<JobMap[K]['input']>;
};

export const jobHandlerMap: JobHandlerMap = {
  send_email: sendEmailHandler,
  clean_workspace_data: cleanWorkspaceDataHandler,
};
