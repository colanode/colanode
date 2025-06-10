import { MutationHandler } from '@colanode/client/lib/types';
import { MutationError, MutationErrorCode } from '@colanode/client/mutations';
import {
  ServerCreateMutationInput,
  ServerCreateMutationOutput,
} from '@colanode/client/mutations/servers/server-create';
import { AppService } from '@colanode/client/services/app-service';

export class ServerCreateMutationHandler
  implements MutationHandler<ServerCreateMutationInput>
{
  private readonly app: AppService;

  constructor(app: AppService) {
    this.app = app;
  }

  async handleMutation(
    input: ServerCreateMutationInput
  ): Promise<ServerCreateMutationOutput> {
    const url = buildUrl(input.url);

    const server = await this.app.createServer(url);
    if (server === null) {
      throw new MutationError(
        MutationErrorCode.ServerInitFailed,
        'There was an error initializing the server. Please make sure the URL is correct and the server is running.'
      );
    }

    return {
      server: server.server,
    };
  }
}

const buildUrl = (urlString: string): URL => {
  try {
    const url = new URL(urlString);
    return url;
  } catch {
    throw new MutationError(
      MutationErrorCode.ServerUrlInvalid,
      'The provided URL is not valid. Please make sure it is a valid server URL.'
    );
  }
};
