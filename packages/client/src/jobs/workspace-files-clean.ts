import {
  JobHandler,
  JobOutput,
  JobConcurrencyConfig,
} from '@colanode/client/jobs';
import { AppService } from '@colanode/client/services/app-service';

export type WorkspaceFilesCleanInput = {
  type: 'workspace.files.clean';
  accountId: string;
  workspaceId: string;
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
        `workspace.files.clean.${input.accountId}.${input.workspaceId}`,
    };

  public async handleJob(input: WorkspaceFilesCleanInput): Promise<JobOutput> {
    const account = this.app.getAccount(input.accountId);
    if (!account) {
      return {
        type: 'cancel',
      };
    }

    const workspace = account.getWorkspace(input.workspaceId);
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
