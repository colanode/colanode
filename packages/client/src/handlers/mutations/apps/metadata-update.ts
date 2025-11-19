import { eventBus } from '@colanode/client/lib/event-bus';
import { mapMetadata } from '@colanode/client/lib/mappers';
import { MutationHandler } from '@colanode/client/lib/types';
import {
  MetadataUpdateMutationInput,
  MetadataUpdateMutationOutput,
} from '@colanode/client/mutations/apps/metadata-update';
import { AppService } from '@colanode/client/services/app-service';

export class MetadataUpdateMutationHandler
  implements MutationHandler<MetadataUpdateMutationInput>
{
  private readonly app: AppService;

  constructor(appService: AppService) {
    this.app = appService;
  }

  async handleMutation(
    input: MetadataUpdateMutationInput
  ): Promise<MetadataUpdateMutationOutput> {
    const updatedMetadata = await this.app.database
      .insertInto('metadata')
      .returningAll()
      .values({
        namespace: input.namespace,
        key: input.key,
        value: input.value,
        created_at: new Date().toISOString(),
      })
      .onConflict((cb) =>
        cb.columns(['namespace', 'key']).doUpdateSet({
          value: input.value,
          updated_at: new Date().toISOString(),
        })
      )
      .executeTakeFirst();

    if (!updatedMetadata) {
      return {
        success: false,
      };
    }

    eventBus.publish({
      type: 'metadata.updated',
      metadata: mapMetadata(updatedMetadata),
    });

    return {
      success: true,
    };
  }
}
