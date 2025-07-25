import {
  JobHandler,
  JobOutput,
  JobConcurrencyConfig,
} from '@colanode/client/jobs';
import { AppService } from '@colanode/client/services/app-service';

export type FilesCleanTempInput = {
  type: 'files.clean.temp';
};

declare module '@colanode/client/jobs' {
  interface JobMap {
    'files.clean.temp': {
      input: FilesCleanTempInput;
    };
  }
}

export class FilesCleanTempJobHandler
  implements JobHandler<FilesCleanTempInput>
{
  private readonly app: AppService;

  public readonly concurrency: JobConcurrencyConfig<FilesCleanTempInput> = {
    limit: 1,
    key: () => `files.clean.temp`,
  };

  constructor(app: AppService) {
    this.app = app;
  }

  public async handleJob(): Promise<JobOutput> {
    const exists = await this.app.fs.exists(this.app.path.temp);
    if (!exists) {
      return {
        type: 'success',
      };
    }

    const fileNames = await this.app.fs.listFiles(this.app.path.temp);
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    for (const fileName of fileNames) {
      try {
        const filePath = this.app.path.tempFile(fileName);
        const metadata = await this.app.fs.metadata(filePath);

        if (metadata.lastModified < oneDayAgo) {
          await this.app.fs.delete(filePath);
        }
      } catch (error) {
        console.error(`Failed to delete temp file: ${fileName}`, error);
      }
    }

    return {
      type: 'success',
    };
  }
}
