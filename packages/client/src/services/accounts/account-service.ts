import {
  AccountSyncInput,
  AccountSyncOutput,
  ApiErrorCode,
  ApiErrorOutput,
  createDebugger,
  Message,
} from '@colanode/core';
import { Kysely, Migration, Migrator } from 'kysely';
import ms from 'ms';

import { AccountConnection } from './account-connection';
import { AccountClient } from './account-client';

import { ServerService } from '../server-service';
import {
  AccountDatabaseSchema,
  accountDatabaseMigrations,
} from '../../databases/account';
import { mapAccount, mapWorkspace } from '../../lib/mappers';
import { WorkspaceService } from '../workspaces/workspace-service';
import { AppService } from '../app-service';
import { eventBus } from '../../lib/event-bus';
import { parseApiError } from '../../lib/axios';
import { Account } from '../../types/accounts';
import { Workspace } from '../../types/workspaces';
import { EventLoop } from '../../lib/event-loop';

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

    this.database = app.kysely.build<AccountDatabaseSchema>(
      app.paths.accountDatabase(this.account.id)
    );

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

      const accountPath = this.app.paths.account(this.account.id);
      await this.app.fs.deleteDirectory(accountPath);

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
        platform: this.app.build.platform,
        version: this.app.build.version,
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
