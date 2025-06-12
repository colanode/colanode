import { ChangeCheckResult, QueryHandler } from '@colanode/client/lib';
import { ServerListQueryInput } from '@colanode/client/queries/servers/server-list';
import { AppService } from '@colanode/client/services/app-service';
import { Event } from '@colanode/client/types/events';
import { ServerDetails } from '@colanode/client/types/servers';

export class ServerListQueryHandler
  implements QueryHandler<ServerListQueryInput>
{
  private readonly app: AppService;

  constructor(app: AppService) {
    this.app = app;
  }

  async handleQuery(_: ServerListQueryInput): Promise<ServerDetails[]> {
    return this.getServers();
  }

  async checkForChanges(
    event: Event,
    _: ServerListQueryInput,
    __: ServerDetails[]
  ): Promise<ChangeCheckResult<ServerListQueryInput>> {
    if (event.type === 'server.created') {
      return {
        hasChanges: true,
        result: this.getServers(),
      };
    } else if (event.type === 'server.updated') {
      return {
        hasChanges: true,
        result: this.getServers(),
      };
    } else if (event.type === 'server.deleted') {
      return {
        hasChanges: true,
        result: this.getServers(),
      };
    } else if (event.type === 'server.availability.changed') {
      return {
        hasChanges: true,
        result: this.getServers(),
      };
    }

    return {
      hasChanges: false,
    };
  }

  private getServers(): ServerDetails[] {
    const serverServices = this.app.getServers();
    const result: ServerDetails[] = [];

    for (const serverService of serverServices) {
      const serverDetails: ServerDetails = {
        ...serverService.server,
        state: serverService.state,
        isOutdated: serverService.isOutdated,
        configUrl: serverService.configUrl,
      };

      result.push(serverDetails);
    }

    return result;
  }
}
