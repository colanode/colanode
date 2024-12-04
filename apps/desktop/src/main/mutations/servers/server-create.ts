import { databaseService } from '@/main/data/database-service';
import { serverService } from '@/main/services/server-service';
import { MutationHandler } from '@/main/types';
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

    const server = await serverService.createServer(input.domain);
    if (server === null) {
      throw new MutationError(
        'invalid_server_domain',
        'Could not fetch server configuration. Please make sure the domain is correct.'
      );
    }

    return {
      success: true,
    };
  }
}
