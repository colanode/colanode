import { MutationHandler } from '../../../lib/types';
import { eventBus } from '../../../lib/event-bus';
import { mapAppMetadata } from '../../../lib/mappers';
import { AppService } from '../../../services/app-service';
import {
  AppMetadataDeleteMutationInput,
  AppMetadataDeleteMutationOutput,
} from '../../../mutations/apps/app-metadata-delete';

export class AppMetadataDeleteMutationHandler
  implements MutationHandler<AppMetadataDeleteMutationInput>
{
  private readonly app: AppService;

  constructor(appService: AppService) {
    this.app = appService;
  }

  async handleMutation(
    input: AppMetadataDeleteMutationInput
  ): Promise<AppMetadataDeleteMutationOutput> {
    const deletedMetadata = await this.app.database
      .deleteFrom('metadata')
      .where('key', '=', input.key)
      .returningAll()
      .executeTakeFirst();

    if (!deletedMetadata) {
      return {
        success: true,
      };
    }

    eventBus.publish({
      type: 'app_metadata_deleted',
      metadata: mapAppMetadata(deletedMetadata),
    });

    return {
      success: true,
    };
  }
}
