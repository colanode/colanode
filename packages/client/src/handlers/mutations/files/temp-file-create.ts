import { eventBus, mapTempFile } from '@colanode/client/lib';
import { MutationHandler } from '@colanode/client/lib/types';
import {
  TempFileCreateMutationInput,
  TempFileCreateMutationOutput,
} from '@colanode/client/mutations';
import { AppService } from '@colanode/client/services/app-service';

export class TempFileCreateMutationHandler
  implements MutationHandler<TempFileCreateMutationInput>
{
  private readonly app: AppService;

  constructor(app: AppService) {
    this.app = app;
  }

  async handleMutation(
    input: TempFileCreateMutationInput
  ): Promise<TempFileCreateMutationOutput> {
    const createdTempFile = await this.app.database
      .insertInto('temp_files')
      .returningAll()
      .values({
        id: input.id,
        name: input.name,
        size: input.size,
        mime_type: input.mimeType,
        subtype: input.subtype,
        path: input.path,
        extension: input.extension,
        created_at: new Date().toISOString(),
        opened_at: new Date().toISOString(),
      })
      .onConflict((oc) => oc.doNothing())
      .executeTakeFirst();

    if (!createdTempFile) {
      return {
        success: false,
      };
    }

    const url = await this.app.fs.url(createdTempFile.path);
    if (!url) {
      return {
        success: false,
      };
    }

    eventBus.publish({
      type: 'temp.file.created',
      tempFile: mapTempFile(createdTempFile, url),
    });

    return {
      success: true,
    };
  }
}
