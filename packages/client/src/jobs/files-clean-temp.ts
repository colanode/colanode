import ms from 'ms';

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

    const oneDayAgo = new Date(Date.now() - ms('1 day')).toISOString();
    const tempFiles = await this.app.database
      .selectFrom('temp_files')
      .selectAll()
      .where('created_at', '<', oneDayAgo)
      .execute();

    for (const tempFile of tempFiles) {
      await this.app.fs.delete(tempFile.path);

      await this.app.database
        .deleteFrom('temp_files')
        .where('id', '=', tempFile.id)
        .execute();
    }

    return {
      type: 'success',
    };
  }
}
