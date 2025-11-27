import {
  JobHandler,
  JobOutput,
  JobConcurrencyConfig,
} from '@colanode/client/jobs';
import { AppService } from '@colanode/client/services/app-service';

export type WorkspaceFilesCleanInput = {
  type: 'workspace.files.clean';
  userId: string;
};

declare module '@colanode/client/jobs' {
  interface JobMap {
    'workspace.files.clean': {
      input: WorkspaceFilesCleanInput;
    };
  }
}

export class WorkspaceFilesCleanJobHandler
  implements JobHandler<WorkspaceFilesCleanInput>
{
  private readonly app: AppService;

  constructor(app: AppService) {
    this.app = app;
  }

  public readonly concurrency: JobConcurrencyConfig<WorkspaceFilesCleanInput> =
    {
      limit: 1,
      key: (input: WorkspaceFilesCleanInput) =>
        `workspace.files.clean.${input.userId}`,
    };

  public async handleJob(input: WorkspaceFilesCleanInput): Promise<JobOutput> {
    const workspace = this.app.getWorkspace(input.userId);
    if (!workspace) {
      return {
        type: 'cancel',
      };
    }

    await workspace.files.cleanupFiles();
    return {
      type: 'success',
    };
  }
}
