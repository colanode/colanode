import { eventBus } from '@colanode/client/lib/event-bus';
import { mapAppMetadata } from '@colanode/client/lib/mappers';
import { MutationHandler } from '@colanode/client/lib/types';
import {
  AppMetadataSaveMutationInput,
  AppMetadataSaveMutationOutput,
} from '@colanode/client/mutations/apps/app-metadata-save';
import { AppService } from '@colanode/client/services/app-service';

export class AppMetadataSaveMutationHandler
  implements MutationHandler<AppMetadataSaveMutationInput>
{
  private readonly app: AppService;

  constructor(appService: AppService) {
    this.app = appService;
  }

  async handleMutation(
    input: AppMetadataSaveMutationInput
  ): Promise<AppMetadataSaveMutationOutput> {
    const createdMetadata = await this.app.database
      .insertInto('metadata')
      .returningAll()
      .values({
        key: input.key,
        value: JSON.stringify(input.value),
        created_at: new Date().toISOString(),
      })
      .onConflict((cb) =>
        cb.columns(['key']).doUpdateSet({
          value: JSON.stringify(input.value),
          updated_at: new Date().toISOString(),
        })
      )
      .executeTakeFirst();

    if (!createdMetadata) {
      return {
        success: false,
      };
    }

    eventBus.publish({
      type: 'app_metadata_saved',
      metadata: mapAppMetadata(createdMetadata),
    });

    return {
      success: true,
    };
  }
}
