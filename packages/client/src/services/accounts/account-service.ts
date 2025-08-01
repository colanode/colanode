import { KyInstance } from 'ky';
import { Kysely, Migration, Migrator } from 'kysely';
import ms from 'ms';

import {
  AccountDatabaseSchema,
  accountDatabaseMigrations,
} from '@colanode/client/databases/account';
import { eventBus } from '@colanode/client/lib/event-bus';
import { parseApiError } from '@colanode/client/lib/ky';
import { mapAccount, mapWorkspace } from '@colanode/client/lib/mappers';
import { AccountSocket } from '@colanode/client/services/accounts/account-socket';
import { AvatarService } from '@colanode/client/services/accounts/avatar-service';
import { AppService } from '@colanode/client/services/app-service';
import { ServerService } from '@colanode/client/services/server-service';
import { WorkspaceService } from '@colanode/client/services/workspaces/workspace-service';
import { Account } from '@colanode/client/types/accounts';
import { Workspace } from '@colanode/client/types/workspaces';
import {
  AccountSyncOutput,
  ApiErrorCode,
  ApiErrorOutput,
  createDebugger,
  Message,
} from '@colanode/core';

const debug = createDebugger('desktop:service:account');

export class AccountService {
  private readonly workspaces: Map<string, WorkspaceService> = new Map();
  private readonly account: Account;

  public readonly app: AppService;
  public readonly server: ServerService;
  public readonly database: Kysely<AccountDatabaseSchema>;
  public readonly avatars: AvatarService;

  public readonly socket: AccountSocket;
  public readonly client: KyInstance;
  private readonly accountSyncJobScheduleId: string;
  private readonly eventSubscriptionId: string;

  constructor(account: Account, server: ServerService, app: AppService) {
    debug(`Initializing account service for account ${account.id}`);

    this.account = account;
    this.server = server;
    this.app = app;

    this.database = app.kysely.build<AccountDatabaseSchema>({
      path: app.path.accountDatabase(this.account.id),
      readonly: false,
    });

    this.avatars = new AvatarService(this);
    this.socket = new AccountSocket(this);
    this.client = this.app.client.extend({
      prefixUrl: this.server.httpBaseUrl,
      headers: {
        Authorization: `Bearer ${this.account.token}`,
      },
    });

    this.accountSyncJobScheduleId = `account.sync.${this.account.id}`;
    this.eventSubscriptionId = eventBus.subscribe((event) => {
      if (
        event.type === 'account.connection.message.received' &&
        event.accountId === this.account.id
      ) {
        this.handleMessage(event.message);
      } else if (
        event.type === 'server.availability.changed' &&
        event.server.domain === this.server.domain
      ) {
        this.app.jobs.triggerJobSchedule(this.accountSyncJobScheduleId);
      }
    });
  }

  public get id(): string {
    return this.account.id;
  }

  public get token(): string {
    return this.account.token;
  }

  public get deviceId(): string {
    return this.account.deviceId;
  }

  public async init(): Promise<void> {
    await this.migrate();
    await this.app.fs.makeDirectory(this.app.path.account(this.account.id));
    await this.app.fs.makeDirectory(
      this.app.path.accountAvatars(this.account.id)
    );

    await this.app.jobs.upsertJobSchedule(
      this.accountSyncJobScheduleId,
      {
        type: 'account.sync',
        accountId: this.account.id,
      },
      ms('1 minute'),
      {
        deduplication: {
          key: this.accountSyncJobScheduleId,
          replace: true,
        },
      }
    );

    this.socket.init();
    await this.initWorkspaces();
  }

  public updateAccount(account: Account): void {
    this.account.email = account.email;
    this.account.token = account.token;
    this.account.deviceId = account.deviceId;
  }

  public getWorkspace(id: string): WorkspaceService | null {
    return this.workspaces.get(id) ?? null;
  }

  public getWorkspaces(): WorkspaceService[] {
    return Array.from(this.workspaces.values());
  }

  public async logout(): Promise<void> {
    try {
      const deletedAccount = await this.app.database
        .deleteFrom('accounts')
        .where('id', '=', this.account.id)
        .executeTakeFirst();

      if (!deletedAccount) {
        throw new Error('Failed to delete account');
      }

      await this.app.jobs.addJob(
        {
          type: 'token.delete',
          token: this.account.token,
          server: this.server.domain,
        },
        {
          retries: 10,
          delay: ms('1 second'),
        }
      );

      await this.app.jobs.removeJobSchedule(this.accountSyncJobScheduleId);

      const workspaces = this.workspaces.values();
      for (const workspace of workspaces) {
        await workspace.delete();
        this.workspaces.delete(workspace.id);
      }

      this.database.destroy();
      this.socket.close();
      eventBus.unsubscribe(this.eventSubscriptionId);

      const databasePath = this.app.path.accountDatabase(this.account.id);
      await this.app.kysely.delete(databasePath);

      const accountPath = this.app.path.account(this.account.id);
      await this.app.fs.delete(accountPath);

      eventBus.publish({
        type: 'account.deleted',
        account: this.account,
      });
    } catch (error) {
      debug(`Error logging out of account ${this.account.id}: ${error}`);
    }
  }

  private async migrate(): Promise<void> {
    debug(`Migrating account database for account ${this.account.id}`);
    const migrator = new Migrator({
      db: this.database,
      provider: {
        getMigrations(): Promise<Record<string, Migration>> {
          return Promise.resolve(accountDatabaseMigrations);
        },
      },
    });

    await migrator.migrateToLatest();
  }

  private async initWorkspaces(): Promise<void> {
    const workspaces = await this.database
      .selectFrom('workspaces')
      .selectAll()
      .where('account_id', '=', this.account.id)
      .execute();

    for (const workspace of workspaces) {
      const mappedWorkspace = mapWorkspace(workspace);
      await this.initWorkspace(mappedWorkspace);
    }
  }

  public async initWorkspace(workspace: Workspace): Promise<void> {
    if (this.workspaces.has(workspace.id)) {
      return;
    }

    const workspaceService = new WorkspaceService(workspace, this);
    await workspaceService.init();

    this.workspaces.set(workspace.id, workspaceService);
  }

  public async deleteWorkspace(id: string): Promise<void> {
    const workspaceService = this.workspaces.get(id);
    if (workspaceService) {
      await workspaceService.delete();
      this.workspaces.delete(id);
    }
  }

  private handleMessage(message: Message): void {
    if (
      message.type === 'account.updated' ||
      message.type === 'workspace.deleted' ||
      message.type === 'workspace.updated' ||
      message.type === 'user.created' ||
      message.type === 'user.updated'
    ) {
      this.app.jobs.triggerJobSchedule(this.accountSyncJobScheduleId);
    }
  }

  public async sync(): Promise<void> {
    debug(`Syncing account ${this.account.id}`);

    if (!this.server.isAvailable) {
      debug(
        `Server ${this.server.domain} is not available for syncing account ${this.account.email}`
      );
      return;
    }

    try {
      const response = await this.client
        .post('v1/accounts/sync')
        .json<AccountSyncOutput>();

      const hasChanges =
        response.account.name !== this.account.name ||
        response.account.avatar !== this.account.avatar;

      const updatedAccount = await this.app.database
        .updateTable('accounts')
        .returningAll()
        .set({
          name: response.account.name,
          avatar: response.account.avatar,
          updated_at: hasChanges
            ? new Date().toISOString()
            : this.account.updatedAt,
          synced_at: new Date().toISOString(),
        })
        .where('id', '=', this.account.id)
        .executeTakeFirst();

      if (!updatedAccount) {
        debug(`Failed to update account ${this.account.email} after sync`);
        return;
      }

      debug(`Updated account ${this.account.email} after sync`);
      const account = mapAccount(updatedAccount);
      this.updateAccount(account);
      this.socket.checkConnection();

      eventBus.publish({
        type: 'account.updated',
        account,
      });

      for (const workspace of response.workspaces) {
        const workspaceService = this.getWorkspace(workspace.id);
        if (!workspaceService) {
          const createdWorkspace = await this.database
            .insertInto('workspaces')
            .returningAll()
            .values({
              id: workspace.id,
              account_id: this.account.id,
              user_id: workspace.user.id,
              name: workspace.name,
              description: workspace.description,
              avatar: workspace.avatar,
              role: workspace.user.role,
              storage_limit: workspace.user.storageLimit,
              max_file_size: workspace.user.maxFileSize,
              created_at: new Date().toISOString(),
            })
            .executeTakeFirst();

          if (!createdWorkspace) {
            debug(`Failed to create workspace ${workspace.id}`);
            continue;
          }

          const mappedWorkspace = mapWorkspace(createdWorkspace);
          await this.initWorkspace(mappedWorkspace);

          eventBus.publish({
            type: 'workspace.created',
            workspace: mappedWorkspace,
          });
        } else {
          const updatedWorkspace = await this.database
            .updateTable('workspaces')
            .returningAll()
            .set({
              name: workspace.name,
              description: workspace.description,
              avatar: workspace.avatar,
              role: workspace.user.role,
              storage_limit: workspace.user.storageLimit,
              max_file_size: workspace.user.maxFileSize,
            })
            .where('id', '=', workspace.id)
            .executeTakeFirst();

          if (updatedWorkspace) {
            const mappedWorkspace = mapWorkspace(updatedWorkspace);
            workspaceService.updateWorkspace(mappedWorkspace);

            eventBus.publish({
              type: 'workspace.updated',
              workspace: mappedWorkspace,
            });
          }
        }
      }

      const workspaceIds = this.workspaces.keys();
      for (const workspaceId of workspaceIds) {
        const updatedWorkspace = response.workspaces.find(
          (w) => w.id === workspaceId
        );

        if (!updatedWorkspace) {
          await this.deleteWorkspace(workspaceId);
        }
      }
    } catch (error) {
      const parsedError = await parseApiError(error);
      if (this.isSyncInvalid(parsedError)) {
        debug(`Account ${this.account.email} is not valid, logging out...`);
        await this.logout();
        return;
      }

      debug(`Failed to sync account ${this.account.email}: ${error}`);
    }
  }

  private isSyncInvalid(error: ApiErrorOutput) {
    return (
      error.code === ApiErrorCode.TokenInvalid ||
      error.code === ApiErrorCode.TokenMissing ||
      error.code === ApiErrorCode.AccountNotFound ||
      error.code === ApiErrorCode.DeviceNotFound
    );
  }
}
