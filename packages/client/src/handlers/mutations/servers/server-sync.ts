import ms from 'ms';

import { MutationHandler } from '@colanode/client/lib/types';
import { MutationError, MutationErrorCode } from '@colanode/client/mutations';
import {
  ServerSyncMutationInput,
  ServerSyncMutationOutput,
} from '@colanode/client/mutations/servers/server-sync';
import { AppService } from '@colanode/client/services/app-service';

export class ServerSyncMutationHandler
  implements MutationHandler<ServerSyncMutationInput>
{
  private readonly app: AppService;

  constructor(app: AppService) {
    this.app = app;
  }

  async handleMutation(
    input: ServerSyncMutationInput
  ): Promise<ServerSyncMutationOutput> {
    const server = this.app.getServer(input.domain);
    if (!server) {
      throw new MutationError(
        MutationErrorCode.ServerNotFound,
        `Server ${input.domain} was not found! Try using a different server.`
      );
    }

    // don't sync if the server has been synced in the last 1 minute
    const lastSyncedAt = server.server.syncedAt;
    if (lastSyncedAt && lastSyncedAt.getTime() > Date.now() - ms('1 minute')) {
      return {
        success: true,
      };
    }

    const success = await server.sync();
    return {
      success,
    };
  }
}
