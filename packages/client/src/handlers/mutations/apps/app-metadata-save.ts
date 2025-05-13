import { MutationHandler } from '../../../lib/types';
import {
  AppMetadataSaveMutationInput,
  AppMetadataSaveMutationOutput,
} from '../../../mutations/apps/app-metadata-save';
import { eventBus } from '../../../lib/event-bus';
import { mapAppMetadata } from '../../../lib/mappers';
import { AppService } from '../../../services/app-service';

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
