import { MutationHandler } from '@colanode/client/lib/types';
import { MutationError, MutationErrorCode } from '@colanode/client/mutations';
import {
  ServerDeleteMutationInput,
  ServerDeleteMutationOutput,
} from '@colanode/client/mutations/servers/server-delete';
import { AppService } from '@colanode/client/services/app-service';
import { isColanodeServer } from '@colanode/core';

export class ServerDeleteMutationHandler
  implements MutationHandler<ServerDeleteMutationInput>
{
  private readonly app: AppService;

  constructor(app: AppService) {
    this.app = app;
  }

  async handleMutation(
    input: ServerDeleteMutationInput
  ): Promise<ServerDeleteMutationOutput> {
    if (isColanodeServer(input.domain)) {
      throw new MutationError(
        MutationErrorCode.ServerDeleteForbidden,
        'Cannot delete Colanode server'
      );
    }

    await this.app.deleteServer(input.domain);

    return {
      success: true,
    };
  }
}
