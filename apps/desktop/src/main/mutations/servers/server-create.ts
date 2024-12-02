import { databaseService } from '@/main/data/database-service';
import { serverService } from '@/main/services/server-service';
import { MutationHandler } from '@/main/types';
import { eventBus } from '@/shared/lib/event-bus';
import { MutationError } from '@/shared/mutations';
import {
  ServerCreateMutationInput,
  ServerCreateMutationOutput,
} from '@/shared/mutations/servers/server-create';

export class ServerCreateMutationHandler
  implements MutationHandler<ServerCreateMutationInput>
{
  async handleMutation(
    input: ServerCreateMutationInput
  ): Promise<ServerCreateMutationOutput> {
    const existingServer = await databaseService.appDatabase
      .selectFrom('servers')
      .selectAll()
      .where('domain', '=', input.domain)
      .executeTakeFirst();

    if (existingServer) {
      throw new MutationError(
        'server_already_exists',
        'A server with this domain already exists.'
      );
    }

    const config = await serverService.fetchServerConfig(input.domain);
    if (config === null) {
      throw new MutationError(
        'invalid_server_domain',
        'Could not fetch server configuration. Please make sure the domain is correct.'
      );
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
