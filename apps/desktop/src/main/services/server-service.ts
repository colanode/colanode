import { ServerConfig } from '@colanode/core';
import axios from 'axios';

import { databaseService } from '@/main/data/database-service';
import { mapServer } from '@/main/utils';
import { eventBus } from '@/shared/lib/event-bus';
import { Server } from '@/shared/types/servers';
import { createDebugger } from '@/main/debugger';

type ServerState = {
  isAvailable: boolean;
  lastCheckedAt: Date;
  lastCheckedSuccessfullyAt: Date | null;
  count: number;
};

class ServerService {
  private readonly states: Map<string, ServerState> = new Map();
  private readonly debug = createDebugger('service:server');

  public async syncServers() {
    this.debug('Syncing servers');

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

  public async createServer(domain: string): Promise<Server | null> {
    if (this.states.has(domain)) {
      return null;
    }

    const config = await this.fetchServerConfig(domain);
    if (config === null) {
      return null;
    }

    const createdServer = await databaseService.appDatabase
      .insertInto('servers')
      .returningAll()
      .values({
        domain,
        name: config.name,
        avatar: config.avatar,
        attributes: JSON.stringify(config.attributes),
        version: config.version,
        created_at: new Date().toISOString(),
      })
      .executeTakeFirst();

    if (!createdServer) {
      return null;
    }

    const server = mapServer(createdServer);
    eventBus.publish({
      type: 'server_created',
      server,
    });

    const state: ServerState = {
      isAvailable: true,
      lastCheckedAt: new Date(),
      lastCheckedSuccessfullyAt: new Date(),
      count: 1,
    };

    this.states.set(domain, state);
    return server;
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

    this.debug(
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
    this.debug(`Fetching server config for ${domain}`);

    const baseUrl = this.buildApiBaseUrl(domain);
    const configUrl = `${baseUrl}/v1/config`;
    try {
      const { status, data } = await axios.get<ServerConfig>(configUrl);
      return status === 200 ? data : null;
    } catch {
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
