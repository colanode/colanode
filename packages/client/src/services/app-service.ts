import { Kysely, Migration, Migrator } from 'kysely';
import ms from 'ms';

import {
  AppDatabaseSchema,
  SelectWorkspace,
  appDatabaseMigrations,
} from '@colanode/client/databases/app';
import { Mediator } from '@colanode/client/handlers';
import { eventBus } from '@colanode/client/lib/event-bus';
import { mapAccount, mapWorkspace } from '@colanode/client/lib/mappers';
import { migrateLegacySpaceTags } from '@colanode/client/lib/workspace-tags';
import { syncTagReferences } from '@colanode/client/lib/tag-references-sync';
import { AccountService } from '@colanode/client/services/accounts/account-service';
import { AppMeta, LocalSyncConfig } from '@colanode/client/services/app-meta';
import { AssetService } from '@colanode/client/services/asset-service';
import { FileSystem } from '@colanode/client/services/file-system';
import { JobService } from '@colanode/client/services/job-service';
import { KyselyService } from '@colanode/client/services/kysely-service';
import { MetadataService } from '@colanode/client/services/metadata-service';
import { PathService } from '@colanode/client/services/path-service';
import { WorkspaceService } from '@colanode/client/services/workspaces/workspace-service';
import { Account } from '@colanode/client/types/accounts';
import {
  createDebugger,
  generateFractionalIndex,
  generateId,
  IdType,
} from '@colanode/core';

const debug = createDebugger('desktop:service:app');

export class AppService {
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

    this.metadata = new MetadataService(this);

    this.eventSubscriptionId = eventBus.subscribe((event) => {
      if (event.type === 'account.deleted') {
        this.accounts.delete(event.account.id);
      } else if (event.type === 'workspace.deleted') {
        this.workspaces.delete(event.workspace.userId);
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

  public getWorkspaces(): WorkspaceService[] {
    return Array.from(this.workspaces.values());
  }

  // Swap the active local-sync configuration at runtime. Mutates `meta.localSync`
  // in place (other services read it via `app.meta`), then asks every workspace
  // service to tear down its CloudSyncService and rebuild it against the new
  // config. Pass `null` to disable peer-to-peer sync entirely.
  public async reloadLocalSync(config: LocalSyncConfig | null): Promise<void> {
    this.meta.localSync = config ?? undefined;

    for (const workspace of this.workspaces.values()) {
      await workspace.applyLocalSync(config);
    }
  }


  public async init(): Promise<void> {
    await this.migrate();
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

    const accountService = new AccountService(account, this);
    await accountService.init();

    this.accounts.set(account.id, accountService);
    return accountService;
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
    await migrateLegacySpaceTags(this, workspace);
    await syncTagReferences(workspaceService);

    this.workspaces.set(workspace.user_id, workspaceService);
    return workspaceService;
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
