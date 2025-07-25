import ms from 'ms';

import {
  JobHandler,
  JobOutput,
  JobConcurrencyConfig,
} from '@colanode/client/jobs';
import { AppService } from '@colanode/client/services/app-service';

export type FileDownloadInput = {
  type: 'file.download';
  accountId: string;
  workspaceId: string;
  downloadId: string;
};

declare module '@colanode/client/jobs' {
  interface JobMap {
    'file.download': {
      input: FileDownloadInput;
    };
  }
}

export class FileDownloadJobHandler implements JobHandler<FileDownloadInput> {
  private readonly app: AppService;

  constructor(app: AppService) {
    this.app = app;
  }

  public readonly concurrency: JobConcurrencyConfig<FileDownloadInput> = {
    limit: 1,
    key: (input: FileDownloadInput) => `file.download.${input.downloadId}`,
  };

  public async handleJob(input: FileDownloadInput): Promise<JobOutput> {
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

    const result = await workspace.files.downloadFile(input.downloadId);
    if (result === null) {
      return {
        type: 'cancel',
      };
    }

    if (result === false) {
      return {
        type: 'retry',
        delay: ms('1 minute'),
      };
    }

    return {
      type: 'success',
    };
  }
}
