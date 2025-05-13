import { Kysely, Migration, Migrator } from 'kysely';
import { ApiErrorCode, ApiHeader, createDebugger } from '@colanode/core';
import ms from 'ms';
import axios from 'axios';
import semver from 'semver';

import { MetadataService } from './metadata-service';
import { AccountService } from './accounts/account-service';
import { ServerService } from './server-service';
import { NotificationService } from './notification-service';
import { FileSystem } from './file-system';
import { AppBuild } from './app-build';
import { KyselyService } from './kysely-service';
import { AppPaths } from './app-paths';

import { AppDatabaseSchema, appDatabaseMigrations } from '../databases/app';
import { mapServer, mapAccount } from '../lib/mappers';
import { Account } from '../types/accounts';
import { Server } from '../types/servers';
import { EventLoop } from '../lib/event-loop';
import { parseApiError } from '../lib/axios';
import { eventBus } from '../lib/event-bus';
import { AssetService } from '../services/asset-service';
import { Mediator } from '../handlers';

const debug = createDebugger('desktop:service:app');

export class AppService {
  private readonly servers: Map<string, ServerService> = new Map();
  private readonly accounts: Map<string, AccountService> = new Map();
  private readonly cleanupEventLoop: EventLoop;
  private readonly eventSubscriptionId: string;

  public readonly build: AppBuild;
  public readonly fs: FileSystem;
  public readonly paths: AppPaths;
  public readonly database: Kysely<AppDatabaseSchema>;
  public readonly metadata: MetadataService;
  public readonly notifications: NotificationService;
  public readonly kysely: KyselyService;
  public readonly asset: AssetService;
  public readonly mediator: Mediator;

  constructor(
    fs: FileSystem,
    build: AppBuild,
    kysely: KyselyService,
    paths: AppPaths
  ) {
    this.build = build;
    this.fs = fs;
    this.paths = paths;
    this.kysely = kysely;
    this.database = kysely.build<AppDatabaseSchema>(paths.appDatabase);
    this.asset = new AssetService(this);
    this.mediator = new Mediator(this);

    // register interceptor to add client headers to all requests
    axios.interceptors.request.use((config) => {
      config.headers[ApiHeader.ClientType] = this.build.type;
      config.headers[ApiHeader.ClientPlatform] = this.build.platform;
      config.headers[ApiHeader.ClientVersion] = this.build.version;
      return config;
    });

    this.metadata = new MetadataService(this);
    this.notifications = new NotificationService(this);

    this.cleanupEventLoop = new EventLoop(
      ms('10 minutes'),
      ms('1 minute'),
      () => {
        this.cleanup();
      }
    );

    this.eventSubscriptionId = eventBus.subscribe((event) => {
      if (event.type === 'account_deleted') {
        this.accounts.delete(event.account.id);
      }
    });
  }

  public async migrate(): Promise<void> {
    debug('Migrating app database');

    const migrator = new Migrator({
      db: this.database,
      provider: {
        getMigrations(): Promise<Record<string, Migration>> {
          return Promise.resolve(appDatabaseMigrations);
        },
      },
    });

    await migrator.migrateToLatest();

    const version = await this.metadata.get('version');
    if (version && semver.lt(version.value, '0.1.0')) {
      await this.deleteAllData();
    }

    await this.metadata.set('version', this.build.version);
    await this.metadata.set('platform', this.build.platform);
  }

  public getAccount(id: string): AccountService | null {
    return this.accounts.get(id) ?? null;
  }

  public getAccounts(): AccountService[] {
    return Array.from(this.accounts.values());
  }

  public getServer(domain: string): ServerService | null {
    return this.servers.get(domain) ?? null;
  }

  public async init(): Promise<void> {
    await this.initServers();
    await this.initAccounts();
    this.cleanupEventLoop.start();
  }

  private async initServers(): Promise<void> {
    const servers = await this.database
      .selectFrom('servers')
      .selectAll()
      .execute();

    for (const server of servers) {
      await this.initServer(mapServer(server));
    }
  }

  private async initAccounts(): Promise<void> {
    const accounts = await this.database
      .selectFrom('accounts')
      .selectAll()
      .execute();

    for (const account of accounts) {
      await this.initAccount(mapAccount(account));
    }
  }

  public async initAccount(account: Account): Promise<AccountService> {
    if (this.accounts.has(account.id)) {
      return this.accounts.get(account.id)!;
    }

    const server = this.servers.get(account.server);
    if (!server) {
      throw new Error('Server not found');
    }

    const accountService = new AccountService(account, server, this);
    await accountService.init();

    this.accounts.set(account.id, accountService);
    return accountService;
  }

  public async initServer(server: Server): Promise<ServerService> {
    if (this.servers.has(server.domain)) {
      return this.servers.get(server.domain)!;
    }

    const serverService = new ServerService(this, server);
    this.servers.set(server.domain, serverService);

    return serverService;
  }

  public async createServer(domain: string): Promise<ServerService | null> {
    if (this.servers.has(domain)) {
      return this.servers.get(domain)!;
    }

    const config = await ServerService.fetchServerConfig(domain);
    if (!config) {
      return null;
    }

    const createdServer = await this.database
      .insertInto('servers')
      .values({
        domain,
        attributes: JSON.stringify(config.attributes),
        avatar: config.avatar,
        name: config.name,
        version: config.version,
        created_at: new Date().toISOString(),
      })
      .returningAll()
      .executeTakeFirst();

    if (!createdServer) {
      return null;
    }

    const server = mapServer(createdServer);
    const serverService = await this.initServer(server);

    eventBus.publish({
      type: 'server_created',
      server,
    });

    return serverService;
  }

  public triggerCleanup(): void {
    this.cleanupEventLoop.trigger();
  }

  private async cleanup(): Promise<void> {
    await this.syncDeletedTokens();
  }

  private async syncDeletedTokens(): Promise<void> {
    debug('Syncing deleted tokens');

    const deletedTokens = await this.database
      .selectFrom('deleted_tokens')
      .innerJoin('servers', 'deleted_tokens.server', 'servers.domain')
      .select([
        'deleted_tokens.token',
        'deleted_tokens.account_id',
        'servers.domain',
        'servers.attributes',
      ])
      .execute();

    if (deletedTokens.length === 0) {
      debug('No deleted tokens found');
      return;
    }

    for (const deletedToken of deletedTokens) {
      const serverService = this.servers.get(deletedToken.domain);
      if (!serverService || !serverService.isAvailable) {
        debug(
          `Server ${deletedToken.domain} is not available for logging out account ${deletedToken.account_id}`
        );
        continue;
      }

      try {
        await axios.delete(`${serverService.apiBaseUrl}/v1/accounts/logout`, {
          headers: {
            Authorization: `Bearer ${deletedToken.token}`,
          },
        });

        await this.database
          .deleteFrom('deleted_tokens')
          .where('token', '=', deletedToken.token)
          .where('account_id', '=', deletedToken.account_id)
          .execute();

        debug(
          `Logged out account ${deletedToken.account_id} from server ${deletedToken.domain}`
        );
      } catch (error) {
        const parsedError = parseApiError(error);
        if (
          parsedError.code === ApiErrorCode.TokenInvalid ||
          parsedError.code === ApiErrorCode.AccountNotFound ||
          parsedError.code === ApiErrorCode.DeviceNotFound
        ) {
          debug(
            `Account ${deletedToken.account_id} is already logged out, skipping...`
          );

          await this.database
            .deleteFrom('deleted_tokens')
            .where('token', '=', deletedToken.token)
            .where('account_id', '=', deletedToken.account_id)
            .execute();

          continue;
        }

        debug(
          `Failed to logout account ${deletedToken.account_id} from server ${deletedToken.domain}`,
          error
        );
      }
    }
  }

  private async deleteAllData(): Promise<void> {
    await this.database.deleteFrom('accounts').execute();
    await this.database.deleteFrom('metadata').execute();
    await this.database.deleteFrom('deleted_tokens').execute();
    await this.fs.deleteDirectory(this.paths.accounts);
  }
}
