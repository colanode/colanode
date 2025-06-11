import { SelectServer } from '@colanode/client/databases/app';
import { ChangeCheckResult, QueryHandler } from '@colanode/client/lib';
import { ServerListQueryInput } from '@colanode/client/queries/servers/server-list';
import { AppService } from '@colanode/client/services/app-service';
import { Event } from '@colanode/client/types/events';
import { Server } from '@colanode/client/types/servers';

export class ServerListQueryHandler
  implements QueryHandler<ServerListQueryInput>
{
  private readonly app: AppService;

  constructor(app: AppService) {
    this.app = app;
  }

  async handleQuery(_: ServerListQueryInput): Promise<Server[]> {
    const rows = await this.fetchServers();
    return this.mapServers(rows);
  }

  async checkForChanges(
    event: Event,
    _: ServerListQueryInput,
    output: Server[]
  ): Promise<ChangeCheckResult<ServerListQueryInput>> {
    if (event.type === 'server.created') {
      const newServers = [...output, event.server];
      return {
        hasChanges: true,
        result: newServers,
      };
    } else if (event.type === 'server.updated') {
      const newServers = output.map((server) =>
        server.domain === event.server.domain ? event.server : server
      );
      return {
        hasChanges: true,
        result: newServers,
      };
    } else if (event.type === 'server.deleted') {
      const newServers = output.filter(
        (server) => server.domain !== event.server.domain
      );
      return {
        hasChanges: true,
        result: newServers,
      };
    }

    return {
      hasChanges: false,
    };
  }

  private fetchServers(): Promise<SelectServer[]> {
    return this.app.database.selectFrom('servers').selectAll().execute();
  }

  private mapServers = (rows: SelectServer[]): Server[] => {
    return rows.map((row) => {
      return {
        domain: row.domain,
        name: row.name,
        avatar: row.avatar,
        attributes: JSON.parse(row.attributes),
        version: row.version,
        createdAt: new Date(row.created_at),
        syncedAt: row.synced_at ? new Date(row.synced_at) : null,
      };
    });
  };
}
