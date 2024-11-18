import { databaseService } from '@/main/data/database-service';
import { MutationHandler } from '@/main/types';
import {
  ServerCreateMutationInput,
  ServerCreateMutationOutput,
} from '@/shared/mutations/server-create';
import { eventBus } from '@/shared/lib/event-bus';
import { serverService } from '../services/server-service';

export class ServerCreateMutationHandler
  implements MutationHandler<ServerCreateMutationInput>
{
  async handleMutation(
    input: ServerCreateMutationInput
  ): Promise<ServerCreateMutationOutput> {
    const config = await serverService.fetchServerConfig(input.domain);
    if (!config) {
      return {
        success: false,
      };
    }

    const createdAt = new Date();
    await databaseService.appDatabase
      .insertInto('servers')
      .values({
        domain: input.domain,
        name: config.name,
        avatar: config.avatar,
        attributes: JSON.stringify(config.attributes),
        version: config.version,
        created_at: createdAt.toISOString(),
      })
      .execute();

    eventBus.publish({
      type: 'server_created',
      server: {
        domain: input.domain,
        name: config.name,
        avatar: config.avatar,
        attributes: config.attributes,
        version: config.version,
        createdAt,
        lastSyncedAt: null,
      },
    });

    return {
      success: true,
    };
  }
}
