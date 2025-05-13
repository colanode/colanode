import { ChangeCheckResult, QueryHandler } from '../../../lib/types';
import { FileMetadataGetQueryInput } from '../../../queries/files/file-metadata-get';
import { Event } from '../../../types/events';
import { FileMetadata } from '../../../types/files';

export class FileMetadataGetQueryHandler
  implements QueryHandler<FileMetadataGetQueryInput>
{
  public async handleQuery(
    _: FileMetadataGetQueryInput
  ): Promise<FileMetadata | null> {
    // const data = this.app.fs.getFileMetadata(input.path);
    // return data;
    return null;
  }

  public async checkForChanges(
    _: Event,
    __: FileMetadataGetQueryInput,
    ___: FileMetadata | null
  ): Promise<ChangeCheckResult<FileMetadataGetQueryInput>> {
    return {
      hasChanges: false,
    };
  }
}
