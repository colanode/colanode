import { mapTempFile } from '@colanode/client/lib';
import { ChangeCheckResult, QueryHandler } from '@colanode/client/lib/types';
import { TempFileListQueryInput } from '@colanode/client/queries';
import { AppService } from '@colanode/client/services';
import { Event } from '@colanode/client/types/events';
import { TempFile } from '@colanode/client/types/files';

export class TempFileListQueryHandler
  implements QueryHandler<TempFileListQueryInput>
{
  private readonly app: AppService;

  public constructor(app: AppService) {
    this.app = app;
  }

  public async handleQuery(_: TempFileListQueryInput): Promise<TempFile[]> {
    return await this.fetchTempFiles();
  }

  public async checkForChanges(
    event: Event,
    input: TempFileListQueryInput,
    output: TempFile[]
  ): Promise<ChangeCheckResult<TempFileListQueryInput>> {
    if (event.type === 'temp.file.created') {
      const newResult = [...output, event.tempFile];

      return {
        hasChanges: true,
        result: newResult,
      };
    }

    if (event.type === 'temp.file.deleted') {
      const newResult = output.filter(
        (tempFile) => tempFile.id !== event.tempFile.id
      );

      return {
        hasChanges: true,
        result: newResult,
      };
    }

    return {
      hasChanges: false,
    };
  }

  private async fetchTempFiles(): Promise<TempFile[]> {
    const tempFiles = await this.app.database
      .selectFrom('temp_files')
      .selectAll()
      .execute();

    const result: TempFile[] = [];
    for (const tempFile of tempFiles) {
      const url = await this.app.fs.url(tempFile.path);
      result.push(mapTempFile(tempFile, url));
    }

    return result;
  }
}
