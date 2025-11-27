import { eventBus } from '@colanode/client/lib/event-bus';
import { mapMetadata } from '@colanode/client/lib/mappers';
import { MutationHandler } from '@colanode/client/lib/types';
import {
  MetadataDeleteMutationInput,
  MetadataDeleteMutationOutput,
} from '@colanode/client/mutations/apps/metadata-delete';
import { AppService } from '@colanode/client/services/app-service';

export class MetadataDeleteMutationHandler
  implements MutationHandler<MetadataDeleteMutationInput>
{
  private readonly app: AppService;

  constructor(appService: AppService) {
    this.app = appService;
  }

  async handleMutation(
    input: MetadataDeleteMutationInput
  ): Promise<MetadataDeleteMutationOutput> {
    const deletedMetadata = await this.app.database
      .deleteFrom('metadata')
      .where('namespace', '=', input.namespace)
      .where('key', '=', input.key)
      .returningAll()
      .executeTakeFirst();

    if (!deletedMetadata) {
      return {
        success: true,
      };
    }

    eventBus.publish({
      type: 'metadata.deleted',
      metadata: mapMetadata(deletedMetadata),
    });

    return {
      success: true,
    };
  }
}
