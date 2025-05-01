import { createDebugger, ServerConfig } from '@colanode/core';
import axios, { isAxiosError } from 'axios';
import ms from 'ms';

import { eventBus } from '@/shared/lib/event-bus';
import { Server } from '@/shared/types/servers';
import { AppService } from '@/main/services/app-service';
import { EventLoop } from '@/main/lib/event-loop';
import { mapServer } from '@/main/lib/mappers';

type ServerState = {
  isAvailable: boolean;
  lastCheckedAt: Date;
  lastCheckedSuccessfullyAt: Date | null;
  count: number;
};

const debug = createDebugger('desktop:service:server');

export class ServerService {
  private readonly appService: AppService;

  private state: ServerState | null = null;
  private eventLoop: EventLoop;

  public readonly server: Server;
  public readonly synapseUrl: string;
  public readonly apiBaseUrl: string;

  constructor(appService: AppService, server: Server) {
    this.appService = appService;
    this.server = server;
    this.synapseUrl = ServerService.buildSynapseUrl(server.domain);
    this.apiBaseUrl = ServerService.buildApiBaseUrl(server.domain);

    this.eventLoop = new EventLoop(ms('1 minute'), ms('1 second'), () => {
      this.sync();
    });
    this.eventLoop.start();
  }

  public get isAvailable() {
    return this.state?.isAvailable ?? false;
  }

  public get domain() {
    return this.server.domain;
  }

  public get version() {
    return this.server.version;
  }

  private async sync() {
    const config = await ServerService.fetchServerConfig(this.server.domain);
    const existingState = this.state;

    const newState: ServerState = {
      isAvailable: config !== null,
      lastCheckedAt: new Date(),
      lastCheckedSuccessfullyAt: config !== null ? new Date() : null,
      count: existingState ? existingState.count + 1 : 1,
    };

    this.state = newState;

    const wasAvailable = existingState?.isAvailable ?? false;
    const isAvailable = newState.isAvailable;
    if (wasAvailable !== isAvailable) {
      eventBus.publish({
        type: 'server_availability_changed',
        server: this.server,
        isAvailable,
      });
    }

    debug(
      `Server ${this.server.domain} is ${isAvailable ? 'available' : 'unavailable'}`
    );

    if (config) {
      const updatedServer = await this.appService.database
        .updateTable('servers')
        .returningAll()
        .set({
          synced_at: new Date().toISOString(),
          attributes: JSON.stringify(config.attributes),
          avatar: config.avatar,
          name: config.name,
          version: config.version,
        })
        .where('domain', '=', this.server.domain)
        .executeTakeFirst();

      this.server.attributes = config.attributes;
      this.server.avatar = config.avatar;
      this.server.name = config.name;
      this.server.version = config.version;

      if (updatedServer) {
        eventBus.publish({
          type: 'server_updated',
          server: mapServer(updatedServer),
        });
      }
    }
  }

  public static async fetchServerConfig(domain: string) {
    const baseUrl = this.buildApiBaseUrl(domain);
    const configUrl = `${baseUrl}/v1/config`;
    try {
      const { data } = await axios.get<ServerConfig>(configUrl);
      return data;
    } catch (error) {
      if (isAxiosError(error)) {
        debug(
          `Server ${domain} is unavailable. Code: ${error.code}, Message: ${error.message}`
        );
      } else {
        debug(`Server ${domain} is unavailable. Unknown error: ${error}`);
      }
    }

    return null;
  }

  private static buildApiBaseUrl(domain: string) {
    const protocol = domain.startsWith('localhost:') ? 'http' : 'https';
    return `${protocol}://${domain}/client`;
  }

  private static buildSynapseUrl(domain: string) {
    const protocol = domain.startsWith('localhost:') ? 'ws' : 'wss';
    return `${protocol}://${domain}/client/v1/synapse`;
  }
}
