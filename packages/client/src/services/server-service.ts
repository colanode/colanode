import ky from 'ky';
import ms from 'ms';

import { eventBus } from '@colanode/client/lib/event-bus';
import { EventLoop } from '@colanode/client/lib/event-loop';
import { mapServer } from '@colanode/client/lib/mappers';
import { isServerOutdated } from '@colanode/client/lib/servers';
import { AppService } from '@colanode/client/services/app-service';
import { Server } from '@colanode/client/types/servers';
import { createDebugger, ServerConfig } from '@colanode/core';

type ServerState = {
  isAvailable: boolean;
  lastCheckedAt: Date;
  lastCheckedSuccessfullyAt: Date | null;
  count: number;
};

const debug = createDebugger('desktop:service:server');

export class ServerService {
  private readonly app: AppService;

  private state: ServerState | null = null;
  private eventLoop: EventLoop;

  public readonly server: Server;
  public readonly socketBaseUrl: string;
  public readonly httpBaseUrl: string;
  public readonly isOutdated: boolean;

  constructor(app: AppService, server: Server) {
    this.app = app;
    this.server = server;
    this.socketBaseUrl = ServerService.buildSocketUrl(server.domain);
    this.httpBaseUrl = ServerService.buildHttpBaseUrl(server.domain);
    this.isOutdated = isServerOutdated(server.version);

    this.eventLoop = new EventLoop(
      ms('1 minute'),
      ms('1 second'),
      this.sync.bind(this)
    );
    this.eventLoop.start();
  }

  public get isAvailable() {
    return !this.isOutdated && (this.state?.isAvailable ?? false);
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
        type: 'server.availability.changed',
        server: this.server,
        isAvailable,
      });
    }

    debug(
      `Server ${this.server.domain} is ${isAvailable ? 'available' : 'unavailable'}`
    );

    if (config) {
      const updatedServer = await this.app.database
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
          type: 'server.updated',
          server: mapServer(updatedServer),
        });
      }
    }
  }

  public static async fetchServerConfig(domain: string) {
    const baseUrl = this.buildHttpBaseUrl(domain);
    const configUrl = `${baseUrl}/v1/config`;
    try {
      const response = await ky.get(configUrl).json<ServerConfig>();
      return response;
    } catch (error) {
      debug(`Server ${domain} is unavailable. ${error}`);
    }

    return null;
  }

  private static buildHttpBaseUrl(domain: string) {
    const protocol = domain.startsWith('localhost:') ? 'http' : 'https';
    return `${protocol}://${domain}/client`;
  }

  private static buildSocketUrl(domain: string) {
    const protocol = domain.startsWith('localhost:') ? 'ws' : 'wss';
    return `${protocol}://${domain}/client`;
  }
}
