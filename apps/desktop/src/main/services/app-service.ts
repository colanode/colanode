import { Kysely, Migration, Migrator, SqliteDialect } from 'kysely';
import SQLite from 'better-sqlite3';
import { ApiErrorCode, ApiHeader, createDebugger } from '@colanode/core';
import ms from 'ms';
import axios from 'axios';
import semver from 'semver';

import fs from 'fs';
import { app } from 'electron';

import { AppDatabaseSchema, appDatabaseMigrations } from '@/main/databases/app';
import { accountsDirectoryPath, appDatabasePath } from '@/main/lib/utils';
import { mapServer, mapAccount } from '@/main/lib/mappers';
import { MetadataService } from '@/main/services/metadata-service';
import { AccountService } from '@/main/services/accounts/account-service';
import { ServerService } from '@/main/services/server-service';
import { Account } from '@/shared/types/accounts';
import { Server } from '@/shared/types/servers';
import { EventLoop } from '@/main/lib/event-loop';
import { parseApiError } from '@/shared/lib/axios';
import { NotificationService } from '@/main/services/notification-service';
import { eventBus } from '@/shared/lib/event-bus';
import { AppPlatform } from '@/shared/types/apps';

const debug = createDebugger('desktop:service:app');

export class AppService {
  private readonly servers: Map<string, ServerService> = new Map();
  private readonly accounts: Map<string, AccountService> = new Map();
  private readonly cleanupEventLoop: EventLoop;
  private readonly eventSubscriptionId: string;

  public readonly database: Kysely<AppDatabaseSchema>;
  public readonly metadata: MetadataService;
  public readonly notifications: NotificationService;
  public readonly version: string;
  public readonly platform: AppPlatform;

  constructor() {
    this.version = app.getVersion();
    this.platform = process.platform as AppPlatform;

    const database = new SQLite(appDatabasePath);
    database.pragma('journal_mode = WAL');

    this.database = new Kysely<AppDatabaseSchema>({
      dialect: new SqliteDialect({
        database,
      }),
    });

    // register interceptor to add client headers to all requests
    axios.interceptors.request.use((config) => {
      config.headers[ApiHeader.ClientType] = 'desktop';
      config.headers[ApiHeader.ClientPlatform] = this.platform;
      config.headers[ApiHeader.ClientVersion] = this.version;
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

    await this.metadata.set('version', this.version);
    await this.metadata.set('platform', this.platform);
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

    if (fs.existsSync(accountsDirectoryPath)) {
      fs.rmSync(accountsDirectoryPath, {
        recursive: true,
        force: true,
        maxRetries: 3,
        retryDelay: 1000,
      });
    }
  }
}

export const appService = new AppService();
