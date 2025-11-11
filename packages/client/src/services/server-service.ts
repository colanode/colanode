import ky from 'ky';
import ms from 'ms';

import { SelectServer } from '@colanode/client/databases';
import { FeatureKey, isFeatureSupported } from '@colanode/client/lib';
import { eventBus } from '@colanode/client/lib/event-bus';
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

  private name: string;
  private avatar: string;
  private attributes: ServerAttributes;
  private createdAt: Date;
  private syncedAt: Date | null;
  private version: string;
  private state: ServerState;
  private isOutdated: boolean;

  public readonly domain: string;
  public readonly configUrl: string;
  public readonly socketBaseUrl: string;
  public readonly httpBaseUrl: string;

  constructor(app: AppService, server: SelectServer) {
    this.app = app;
    this.domain = server.domain;
    this.name = server.name;
    this.avatar = server.avatar;
    this.attributes = JSON.parse(server.attributes) ?? {};
    this.version = server.version;
    this.createdAt = new Date(server.created_at);
    this.syncedAt = server.synced_at ? new Date(server.synced_at) : null;
    this.configUrl = this.buildConfigUrl();
    this.socketBaseUrl = this.buildSocketBaseUrl();
    this.httpBaseUrl = this.buildHttpBaseUrl();
    this.isOutdated = isServerOutdated(server.version);

    this.state = {
      isAvailable: true,
      lastCheckedAt: new Date(),
      lastCheckedSuccessfullyAt: null,
      count: 0,
    };
  }

  public get server(): Server {
    return {
      domain: this.domain,
      name: this.name,
      avatar: this.avatar,
      attributes: this.attributes,
      version: this.version,
      createdAt: this.createdAt,
      syncedAt: this.syncedAt,
      state: this.state,
      configUrl: this.configUrl,
      isOutdated: this.isOutdated,
    };
  }

  public get isAvailable() {
    return this.state.isAvailable;
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
    if (config) {
      const attributes: ServerAttributes = {
        ...this.attributes,
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

      this.attributes = attributes;
      this.avatar = config.avatar;
      this.name = config.name;
      this.version = config.version;
      this.syncedAt = new Date();
      this.isOutdated = isServerOutdated(config.version);

      await this.app.database
        .updateTable('servers')
        .returningAll()
        .set({
          synced_at: new Date().toISOString(),
          avatar: config.avatar,
          name: config.name,
          version: config.version,
          attributes: JSON.stringify(attributes),
        })
        .where('domain', '=', this.domain)
        .executeTakeFirst();
    }

    const existingState = this.state;
    const newState: ServerState = {
      isAvailable: config !== null,
      lastCheckedAt: new Date(),
      lastCheckedSuccessfullyAt: config !== null ? new Date() : null,
      count: existingState ? existingState.count + 1 : 1,
    };

    const wasAvailable = existingState?.isAvailable ?? false;
    const isAvailable = newState.isAvailable;
    if (wasAvailable !== isAvailable) {
      eventBus.publish({
        type: 'server.availability.changed',
        domain: this.domain,
        isAvailable,
      });
    }

    this.state = newState;

    eventBus.publish({
      type: 'server.updated',
      server: this.server,
    });
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
    const protocol = this.attributes.insecure ? 'http' : 'https';
    return this.buildBaseUrl(protocol) + '/config';
  }

  private buildHttpBaseUrl() {
    const protocol = this.attributes.insecure ? 'http' : 'https';
    return this.buildBaseUrl(protocol) + '/client';
  }

  private buildSocketBaseUrl() {
    const protocol = this.attributes.insecure ? 'ws' : 'wss';
    return this.buildBaseUrl(protocol) + '/client';
  }

  private buildBaseUrl(protocol: string) {
    const prefix = this.attributes.pathPrefix
      ? `/${this.attributes.pathPrefix}`
      : '';

    return `${protocol}://${this.domain}${prefix}`;
  }
}
