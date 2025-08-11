import ky from 'ky';
import ms from 'ms';

import { FeatureKey, isFeatureSupported } from '@colanode/client/lib';
import { eventBus } from '@colanode/client/lib/event-bus';
import { mapServer } from '@colanode/client/lib/mappers';
import { isServerOutdated } from '@colanode/client/lib/servers';
import { AppService } from '@colanode/client/services/app-service';
import {
  Server,
  ServerAttributes,
  ServerState,
} from '@colanode/client/types/servers';
import { createDebugger, ServerConfig } from '@colanode/core';

const debug = createDebugger('desktop:service:server');

export class ServerService {
  private readonly app: AppService;

  public state: ServerState | null = null;
  public isOutdated: boolean;

  public readonly server: Server;
  public readonly configUrl: string;
  public readonly socketBaseUrl: string;
  public readonly httpBaseUrl: string;

  constructor(app: AppService, server: Server) {
    this.app = app;
    this.server = server;
    this.configUrl = this.buildConfigUrl();
    this.socketBaseUrl = this.buildSocketBaseUrl();
    this.httpBaseUrl = this.buildHttpBaseUrl();
    this.isOutdated = isServerOutdated(server.version);
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

  public isFeatureSupported(feature: FeatureKey) {
    return isFeatureSupported(feature, this.version);
  }

  public async init(): Promise<void> {
    const scheduleId = `server.sync.${this.domain}`;
    await this.app.jobs.upsertJobSchedule(
      scheduleId,
      {
        type: 'server.sync',
        server: this.domain,
      },
      ms('1 minute'),
      {
        deduplication: {
          key: scheduleId,
          replace: true,
        },
      }
    );

    await this.app.jobs.triggerJobSchedule(scheduleId);
  }

  public async sync() {
    const config = await ServerService.fetchServerConfig(this.configUrl);
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
      const attributes: ServerAttributes = {
        ...this.server.attributes,
        sha: config.sha,
        account: config.account?.google.enabled
          ? {
              google: {
                enabled: config.account.google.enabled,
                clientId: config.account.google.clientId,
              },
            }
          : undefined,
      };

      const updatedServer = await this.app.database
        .updateTable('servers')
        .returningAll()
        .set({
          synced_at: new Date().toISOString(),
          avatar: config.avatar,
          name: config.name,
          version: config.version,
          attributes: JSON.stringify(attributes),
        })
        .where('domain', '=', this.server.domain)
        .executeTakeFirst();

      this.server.avatar = config.avatar;
      this.server.name = config.name;
      this.server.version = config.version;
      this.server.attributes = attributes;
      this.isOutdated = isServerOutdated(config.version);

      if (updatedServer) {
        eventBus.publish({
          type: 'server.updated',
          server: mapServer(updatedServer),
        });
      }
    }
  }

  public static async fetchServerConfig(configUrl: URL | string) {
    try {
      const response = await ky.get(configUrl).json<ServerConfig>();
      return response;
    } catch (error) {
      debug(
        `Server with config URL ${configUrl.toString()} is unavailable. ${error}`
      );
    }

    return null;
  }

  private buildConfigUrl() {
    const protocol = this.server.attributes.insecure ? 'http' : 'https';
    return this.buildBaseUrl(protocol) + '/config';
  }

  private buildHttpBaseUrl() {
    const protocol = this.server.attributes.insecure ? 'http' : 'https';
    return this.buildBaseUrl(protocol) + '/client';
  }

  private buildSocketBaseUrl() {
    const protocol = this.server.attributes.insecure ? 'ws' : 'wss';
    return this.buildBaseUrl(protocol) + '/client';
  }

  private buildBaseUrl(protocol: string) {
    const prefix = this.server.attributes.pathPrefix
      ? `/${this.server.attributes.pathPrefix}`
      : '';

    return `${protocol}://${this.server.domain}${prefix}`;
  }
}
