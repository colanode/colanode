import ms from 'ms';

import {
  JobHandler,
  JobOutput,
  JobConcurrencyConfig,
} from '@colanode/client/jobs';
import { AppService } from '@colanode/client/services/app-service';

export type FileUploadInput = {
  type: 'file.upload';
  accountId: string;
  workspaceId: string;
  fileId: string;
};

declare module '@colanode/client/jobs' {
  interface JobMap {
    'file.upload': {
      input: FileUploadInput;
    };
  }
}

export class FileUploadJobHandler implements JobHandler<FileUploadInput> {
  private readonly app: AppService;

  constructor(app: AppService) {
    this.app = app;
  }

  public readonly concurrency: JobConcurrencyConfig<FileUploadInput> = {
    limit: 1,
    key: (input: FileUploadInput) => `file.upload.${input.fileId}`,
  };

  public async handleJob(input: FileUploadInput): Promise<JobOutput> {
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

    const result = await workspace.files.uploadFile(input.fileId);
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
