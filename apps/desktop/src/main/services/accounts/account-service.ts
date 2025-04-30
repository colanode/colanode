import {
  AccountSyncInput,
  AccountSyncOutput,
  ApiErrorCode,
  ApiErrorOutput,
  createDebugger,
  Message,
} from '@colanode/core';
import { Kysely, Migration, Migrator, SqliteDialect } from 'kysely';
import SQLite from 'better-sqlite3';
import ms from 'ms';

import fs from 'fs';
import path from 'path';

import { ServerService } from '@/main/services/server-service';
import {
  AccountDatabaseSchema,
  accountDatabaseMigrations,
} from '@/main/databases/account';
import { mapAccount, mapWorkspace } from '@/main/lib/mappers';
import { getAccountDirectoryPath } from '@/main/lib/utils';
import { WorkspaceService } from '@/main/services/workspaces/workspace-service';
import { AccountConnection } from '@/main/services/accounts/account-connection';
import { AccountClient } from '@/main/services/accounts/account-client';
import { AppService } from '@/main/services/app-service';
import { eventBus } from '@/shared/lib/event-bus';
import { parseApiError } from '@/shared/lib/axios';
import { Account } from '@/shared/types/accounts';
import { Workspace } from '@/shared/types/workspaces';
import { EventLoop } from '@/main/lib/event-loop';

const debug = createDebugger('desktop:service:account');

export class AccountService {
  private readonly workspaces: Map<string, WorkspaceService> = new Map();
  private readonly eventLoop: EventLoop;
  private readonly account: Account;

  public readonly app: AppService;
  public readonly server: ServerService;
  public readonly database: Kysely<AccountDatabaseSchema>;

  public readonly connection: AccountConnection;
  public readonly client: AccountClient;
  private readonly eventSubscriptionId: string;

  constructor(account: Account, server: ServerService, app: AppService) {
    debug(`Initializing account service for account ${account.id}`);

    this.account = account;
    this.server = server;
    this.app = app;

    const accountDataPath = getAccountDirectoryPath(account.id);

    if (!fs.existsSync(accountDataPath)) {
      fs.mkdirSync(accountDataPath, { recursive: true });
    }

    const accountDatabasePath = path.join(accountDataPath, 'account.db');
    const database = new SQLite(accountDatabasePath);
    database.pragma('journal_mode = WAL');

    this.database = new Kysely<AccountDatabaseSchema>({
      dialect: new SqliteDialect({
        database,
      }),
    });

    this.client = new AccountClient(this);
    this.connection = new AccountConnection(this);

    this.sync = this.sync.bind(this);
    this.eventLoop = new EventLoop(ms('1 minute'), ms('1 second'), this.sync);

    this.eventSubscriptionId = eventBus.subscribe((event) => {
      if (
        event.type === 'server_availability_changed' &&
        event.server.domain === this.server.domain &&
        event.isAvailable
      ) {
        this.eventLoop.trigger();
      } else if (
        event.type === 'account_connection_message' &&
        event.accountId === this.account.id
      ) {
        this.handleMessage(event.message);
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
    this.connection.init();
    this.eventLoop.start();

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
      await this.app.database.transaction().execute(async (tx) => {
        const deletedAccount = await tx
          .deleteFrom('accounts')
          .where('id', '=', this.account.id)
          .executeTakeFirst();

        if (!deletedAccount) {
          throw new Error('Failed to delete account');
        }

        await tx
          .insertInto('deleted_tokens')
          .values({
            account_id: this.account.id,
            token: this.account.token,
            server: this.server.domain,
            created_at: new Date().toISOString(),
          })
          .execute();
      });

      const workspaces = this.workspaces.values();
      for (const workspace of workspaces) {
        await workspace.delete();
        this.workspaces.delete(workspace.id);
      }

      this.database.destroy();
      this.connection.close();
      this.eventLoop.stop();
      eventBus.unsubscribe(this.eventSubscriptionId);

      const accountPath = getAccountDirectoryPath(this.account.id);
      if (fs.existsSync(accountPath)) {
        fs.rmSync(accountPath, {
          recursive: true,
          force: true,
          maxRetries: 3,
          retryDelay: 1000,
        });
      }

      eventBus.publish({
        type: 'account_deleted',
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
      message.type === 'account_updated' ||
      message.type === 'workspace_deleted' ||
      message.type === 'workspace_updated' ||
      message.type === 'user_created' ||
      message.type === 'user_updated'
    ) {
      this.eventLoop.trigger();
    }
  }

  private async sync(): Promise<void> {
    debug(`Syncing account ${this.account.id}`);

    if (!this.server.isAvailable) {
      debug(
        `Server ${this.server.domain} is not available for syncing account ${this.account.email}`
      );
      return;
    }

    try {
      const body: AccountSyncInput = {
        platform: process.platform,
        version: this.app.version,
      };

      const { data } = await this.client.post<AccountSyncOutput>(
        '/v1/accounts/sync',
        body
      );

      const hasChanges =
        data.account.name !== this.account.name ||
        data.account.avatar !== this.account.avatar;

      const updatedAccount = await this.app.database
        .updateTable('accounts')
        .returningAll()
        .set({
          name: data.account.name,
          avatar: data.account.avatar,
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

      eventBus.publish({
        type: 'account_updated',
        account,
      });

      for (const workspace of data.workspaces) {
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
            type: 'workspace_created',
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
              type: 'workspace_updated',
              workspace: mappedWorkspace,
            });
          }
        }
      }

      const workspaceIds = this.workspaces.keys();
      for (const workspaceId of workspaceIds) {
        const updatedWorkspace = data.workspaces.find(
          (w) => w.id === workspaceId
        );

        if (!updatedWorkspace) {
          await this.deleteWorkspace(workspaceId);
        }
      }
    } catch (error) {
      const parsedError = parseApiError(error);
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
