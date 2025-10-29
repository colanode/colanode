import ky, { KyInstance } from 'ky';
import { Kysely, Migration, Migrator } from 'kysely';
import ms from 'ms';

import {
  AppDatabaseSchema,
  SelectServer,
  SelectWorkspace,
  appDatabaseMigrations,
} from '@colanode/client/databases/app';
import { Mediator } from '@colanode/client/handlers';
import { eventBus } from '@colanode/client/lib/event-bus';
import { mapAccount, mapWorkspace } from '@colanode/client/lib/mappers';
import { AccountService } from '@colanode/client/services/accounts/account-service';
import { AppMeta } from '@colanode/client/services/app-meta';
import { AssetService } from '@colanode/client/services/asset-service';
import { FileSystem } from '@colanode/client/services/file-system';
import { JobService } from '@colanode/client/services/job-service';
import { KyselyService } from '@colanode/client/services/kysely-service';
import { MetadataService } from '@colanode/client/services/metadata-service';
import { PathService } from '@colanode/client/services/path-service';
import { ServerService } from '@colanode/client/services/server-service';
import { WorkspaceService } from '@colanode/client/services/workspaces/workspace-service';
import { Account } from '@colanode/client/types/accounts';
import { ServerAttributes } from '@colanode/client/types/servers';
import {
  ApiHeader,
  build,
  createDebugger,
  generateFractionalIndex,
  generateId,
  IdType,
} from '@colanode/core';

const debug = createDebugger('desktop:service:app');

export class AppService {
  private readonly servers: Map<string, ServerService> = new Map();
  private readonly accounts: Map<string, AccountService> = new Map();
  private readonly workspaces: Map<string, WorkspaceService> = new Map();
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
  }

  public getAccount(id: string): AccountService | null {
    return this.accounts.get(id) ?? null;
  }

  public getWorkspace(userId: string): WorkspaceService | null {
    return this.workspaces.get(userId) ?? null;
  }

  public getAccounts(): AccountService[] {
    return Array.from(this.accounts.values());
  }

  public getServers(): ServerService[] {
    return Array.from(this.servers.values());
  }

  public getWorkspaces(): WorkspaceService[] {
    return Array.from(this.workspaces.values());
  }

  public getServer(domain: string): ServerService | null {
    return this.servers.get(domain) ?? null;
  }

  public async init(): Promise<void> {
    await this.migrate();
    await this.initServers();
    await this.initAccounts();
    await this.initWorkspaces();
    await this.fs.makeDirectory(this.path.temp);
    await this.jobs.init();
    await this.initJobSchedules();

    // make sure there is at least one tab in desktop app
    if (this.meta.type === 'desktop') {
      const tabs = await this.database.selectFrom('tabs').selectAll().execute();
      if (tabs.length === 0) {
        await this.database
          .insertInto('tabs')
          .values({
            id: generateId(IdType.Tab),
            location: '/',
            index: generateFractionalIndex(),
            last_active_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
          })
          .execute();
      }
    }
  }

  private async initServers(): Promise<void> {
    const servers = await this.database
      .selectFrom('servers')
      .selectAll()
      .execute();

    for (const server of servers) {
      await this.initServer(server);
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

  private async initWorkspaces(): Promise<void> {
    const workspaces = await this.database
      .selectFrom('workspaces')
      .selectAll()
      .execute();

    for (const workspace of workspaces) {
      await this.initWorkspace(workspace);
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

  public async initServer(server: SelectServer): Promise<ServerService> {
    if (this.servers.has(server.domain)) {
      return this.servers.get(server.domain)!;
    }

    const serverService = new ServerService(this, server);
    await serverService.init();

    this.servers.set(server.domain, serverService);
    return serverService;
  }

  public async initWorkspace(
    workspace: SelectWorkspace
  ): Promise<WorkspaceService> {
    if (this.workspaces.has(workspace.user_id)) {
      return this.workspaces.get(workspace.user_id)!;
    }

    const account = this.accounts.get(workspace.account_id);
    if (!account) {
      throw new Error('Account not found');
    }

    const workspaceService = new WorkspaceService(
      mapWorkspace(workspace),
      account
    );
    await workspaceService.init();

    this.workspaces.set(workspace.user_id, workspaceService);
    return workspaceService;
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

    const serverService = await this.initServer(createdServer);

    eventBus.publish({
      type: 'server.created',
      server: serverService.server,
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
        server: server.server,
      });
    }
  }

  private async initJobSchedules(): Promise<void> {
    await this.initTempFilesCleanJobSchedule();
    await this.initAvatarsCleanJobSchedule();
  }

  private async initTempFilesCleanJobSchedule(): Promise<void> {
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

  private async initAvatarsCleanJobSchedule(): Promise<void> {
    const scheduleId = 'avatars.clean';
    await this.jobs.upsertJobSchedule(
      scheduleId,
      {
        type: 'avatars.clean',
      },
      ms('1 day'),
      {
        deduplication: {
          key: scheduleId,
          replace: true,
        },
      }
    );
  }
}
