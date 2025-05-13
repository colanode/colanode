import { AppService } from '../../../services/app-service';
import { MutationHandler } from '../../../lib/types';
import { MutationError, MutationErrorCode } from '../../../mutations';
import {
  ServerCreateMutationInput,
  ServerCreateMutationOutput,
} from '../../../mutations/servers/server-create';

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
    const domain = parseDomain(input.domain);
    const server = await this.app.createServer(domain);
    if (server === null) {
      throw new MutationError(
        MutationErrorCode.ServerInitFailed,
        'Could not fetch server configuration. Please make sure the domain is correct.'
      );
    }

    return {
      server: server.server,
    };
  }
}

const parseDomain = (domain: string): string => {
  try {
    const lowerCaseDomain = domain.toLowerCase();
    const urlString = lowerCaseDomain.startsWith('http')
      ? lowerCaseDomain
      : `http://${lowerCaseDomain}`;

    const url = new URL(urlString);
    return url.host; // host includes domain + port if present
  } catch {
    // If not a valid URL, treat as domain directly
    throw new MutationError(
      MutationErrorCode.ServerDomainInvalid,
      'The provided domain is not valid. Please make sure it is a valid server domain.'
    );
  }
};
