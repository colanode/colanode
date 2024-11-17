import axios from 'axios';
import { Server, ServerConfig } from '@/shared/types/servers';
import { databaseService } from '@/main/data/database-service';
import { mapServer } from '@/main/utils';
import { eventBus } from '@/shared/lib/event-bus';

type ServerState = {
  isAvailable: boolean;
  lastCheckedAt: Date;
  lastCheckedSuccessfullyAt: Date | null;
  count: number;
};

class ServerService {
  private readonly states: Map<string, ServerState> = new Map();

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
    const config = await this.fetchServerConfig(server);
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

    console.log(
      `Server ${server.domain} is ${isAvailable ? 'available' : 'unavailable'}`
    );
  }

  private async fetchServerConfig(server: Server) {
    const baseUrl = this.buildServerBaseUrl(server);
    const configUrl = `${baseUrl}/v1/config`;
    try {
      const { status, data } = await axios.get<ServerConfig>(configUrl);
      return status === 200 ? data : null;
    } catch (error) {
      return null;
    }
  }

  private buildServerBaseUrl(server: Server) {
    const domain = server.domain;
    const protocol = domain.startsWith('localhost:') ? 'http' : 'https';
    return `${protocol}://${domain}`;
  }
}

export const serverService = new ServerService();
