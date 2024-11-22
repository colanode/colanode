import axios from 'axios';
import { Server } from '@/shared/types/servers';
import { ServerConfig } from '@colanode/core';
import { databaseService } from '@/main/data/database-service';
import { mapServer } from '@/main/utils';
import { eventBus } from '@/shared/lib/event-bus';
import { logService } from '@/main/services/log-service';

type ServerState = {
  isAvailable: boolean;
  lastCheckedAt: Date;
  lastCheckedSuccessfullyAt: Date | null;
  count: number;
};

class ServerService {
  private readonly states: Map<string, ServerState> = new Map();
  private readonly logger = logService.createLogger('server-service');

  public async syncServers() {
    const rows = await databaseService.appDatabase
      .selectFrom('servers')
      .selectAll()
      .execute();

    const servers = rows.map(mapServer);
    for (const server of servers) {
      await this.syncServer(server);
    }
  }

  public isAvailable(domain: string) {
    const state = this.states.get(domain);
    return state?.isAvailable ?? false;
  }

  private async syncServer(server: Server) {
    const config = await this.fetchServerConfig(server.domain);
    const existingState = this.states.get(server.domain);

    const newState: ServerState = {
      isAvailable: config !== null,
      lastCheckedAt: new Date(),
      lastCheckedSuccessfullyAt: config !== null ? new Date() : null,
      count: existingState ? existingState.count + 1 : 1,
    };

    this.states.set(server.domain, newState);

    const wasAvailable = existingState?.isAvailable ?? false;
    const isAvailable = newState.isAvailable;
    if (wasAvailable !== isAvailable) {
      eventBus.publish({
        type: 'server_availability_changed',
        server,
        isAvailable,
      });
    }

    this.logger.info(
      `Server ${server.domain} is ${isAvailable ? 'available' : 'unavailable'}`
    );

    if (config) {
      const updatedServer = await databaseService.appDatabase
        .updateTable('servers')
        .returningAll()
        .set({
          last_synced_at: new Date().toISOString(),
          attributes: JSON.stringify(config.attributes),
          avatar: config.avatar,
          name: config.name,
          version: config.version,
        })
        .where('domain', '=', server.domain)
        .executeTakeFirst();

      if (updatedServer) {
        eventBus.publish({
          type: 'server_updated',
          server: mapServer(updatedServer),
        });
      }
    }
  }

  public async fetchServerConfig(domain: string) {
    const baseUrl = this.buildApiBaseUrl(domain);
    const configUrl = `${baseUrl}/v1/config`;
    try {
      const { status, data } = await axios.get<ServerConfig>(configUrl);
      return status === 200 ? data : null;
    } catch (error) {
      return null;
    }
  }

  public buildApiBaseUrl(domain: string) {
    const protocol = domain.startsWith('localhost:') ? 'http' : 'https';
    return `${protocol}://${domain}`;
  }

  public buildSynapseUrl(domain: string) {
    const protocol = domain.startsWith('localhost:') ? 'ws' : 'wss';
    return `${protocol}://${domain}/v1/synapse`;
  }
}

export const serverService = new ServerService();
