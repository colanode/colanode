import ky, { KyInstance } from 'ky';
import { Kysely, Migration, Migrator } from 'kysely';
import ms from 'ms';
import semver from 'semver';

import {
  AppDatabaseSchema,
  appDatabaseMigrations,
} from '@colanode/client/databases/app';
import { Mediator } from '@colanode/client/handlers';
import { eventBus } from '@colanode/client/lib/event-bus';
import { mapServer, mapAccount } from '@colanode/client/lib/mappers';
import { AccountService } from '@colanode/client/services/accounts/account-service';
import { AppMeta } from '@colanode/client/services/app-meta';
import { AssetService } from '@colanode/client/services/asset-service';
import { FileSystem } from '@colanode/client/services/file-system';
import { JobService } from '@colanode/client/services/job-service';
import { KyselyService } from '@colanode/client/services/kysely-service';
import { MetadataService } from '@colanode/client/services/metadata-service';
import { PathService } from '@colanode/client/services/path-service';
import { ServerService } from '@colanode/client/services/server-service';
import { Account } from '@colanode/client/types/accounts';
import { Server, ServerAttributes } from '@colanode/client/types/servers';
import { ApiHeader, build, createDebugger } from '@colanode/core';

const debug = createDebugger('desktop:service:app');

export class AppService {
  private readonly servers: Map<string, ServerService> = new Map();
  private readonly accounts: Map<string, AccountService> = new Map();
  private readonly eventSubscriptionId: string;

  public readonly meta: AppMeta;
  public readonly fs: FileSystem;
  public readonly path: PathService;
  public readonly database: Kysely<AppDatabaseSchema>;
  public readonly metadata: MetadataService;
  public readonly kysely: KyselyService;
  public readonly mediator: Mediator;
  public readonly assets: AssetService;
  public readonly jobs: JobService;
  public readonly client: KyInstance;

  constructor(
    meta: AppMeta,
    fs: FileSystem,
    kysely: KyselyService,
    path: PathService
  ) {
    this.meta = meta;
    this.fs = fs;
    this.path = path;
    this.kysely = kysely;

    this.database = kysely.build<AppDatabaseSchema>({
      path: path.appDatabase,
      readonly: false,
    });

    this.mediator = new Mediator(this);
    this.assets = new AssetService(this);
    this.jobs = new JobService(this);

    this.client = ky.create({
      headers: {
        [ApiHeader.ClientType]: this.meta.type,
        [ApiHeader.ClientPlatform]: this.meta.platform,
        [ApiHeader.ClientVersion]: build.version,
      },
      timeout: ms('30 seconds'),
    });

    this.metadata = new MetadataService(this);

    this.eventSubscriptionId = eventBus.subscribe((event) => {
      if (event.type === 'account.deleted') {
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

    const versionMetadata = await this.metadata.get('version');
    const version = semver.parse(versionMetadata?.value);
    if (version && semver.lt(version, '0.2.0')) {
      await this.deleteAllData();
    }

    await this.metadata.set('version', build.version);
    await this.metadata.set('platform', this.meta.platform);
  }

  public getAccount(id: string): AccountService | null {
    return this.accounts.get(id) ?? null;
  }

  public getAccounts(): AccountService[] {
    return Array.from(this.accounts.values());
  }

  public getServers(): ServerService[] {
    return Array.from(this.servers.values());
  }

  public getServer(domain: string): ServerService | null {
    return this.servers.get(domain) ?? null;
  }

  public async init(): Promise<void> {
    await this.initServers();
    await this.initAccounts();
    await this.fs.makeDirectory(this.path.temp);
    await this.jobs.init();

    const scheduleId = 'temp.files.clean';
    await this.jobs.upsertJobSchedule(
      scheduleId,
      {
        type: 'temp.files.clean',
      },
      ms('5 minutes'),
      {
        deduplication: {
          key: scheduleId,
          replace: true,
        },
      }
    );
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
    await serverService.init();

    this.servers.set(server.domain, serverService);
    return serverService;
  }

  public async createServer(url: URL): Promise<ServerService | null> {
    const domain = url.host;
    if (this.servers.has(domain)) {
      return this.servers.get(domain)!;
    }

    const config = await ServerService.fetchServerConfig(url);
    if (!config) {
      return null;
    }

    const attributes: ServerAttributes = {
      sha: config.sha,
      pathPrefix: config.pathPrefix,
      insecure: url.protocol === 'http:',
      account: config.account?.google.enabled
        ? {
            google: {
              enabled: config.account.google.enabled,
              clientId: config.account.google.clientId,
            },
          }
        : undefined,
    };

    const createdServer = await this.database
      .insertInto('servers')
      .values({
        domain,
        attributes: JSON.stringify(attributes),
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
      type: 'server.created',
      server,
    });

    return serverService;
  }

  public async deleteServer(domain: string): Promise<void> {
    const server = this.servers.get(domain);
    if (!server) {
      return;
    }

    for (const account of this.accounts.values()) {
      if (account.server.domain === domain) {
        await account.logout();
      }
    }

    const deletedServer = await this.database
      .deleteFrom('servers')
      .returningAll()
      .where('domain', '=', domain)
      .executeTakeFirst();

    this.servers.delete(domain);

    if (deletedServer) {
      eventBus.publish({
        type: 'server.deleted',
        server: mapServer(deletedServer),
      });
    }
  }

  private async deleteAllData(): Promise<void> {
    await this.database.deleteFrom('accounts').execute();
    await this.database.deleteFrom('metadata').execute();
    await this.database.deleteFrom('job_schedules').execute();
    await this.database.deleteFrom('jobs').execute();
    await this.fs.delete(this.path.accounts);
  }
}
