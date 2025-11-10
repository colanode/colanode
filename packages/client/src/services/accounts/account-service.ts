import { KyInstance } from 'ky';
import ms from 'ms';

import { SelectWorkspace } from '@colanode/client/databases';
import { eventBus } from '@colanode/client/lib/event-bus';
import { parseApiError } from '@colanode/client/lib/ky';
import { mapAccount, mapWorkspace } from '@colanode/client/lib/mappers';
import { AccountSocket } from '@colanode/client/services/accounts/account-socket';
import { AppService } from '@colanode/client/services/app-service';
import { ServerService } from '@colanode/client/services/server-service';
import { Account } from '@colanode/client/types/accounts';
import {
  AccountSyncOutput,
  ApiErrorCode,
  ApiErrorOutput,
  createDebugger,
  Message,
} from '@colanode/core';

const debug = createDebugger('desktop:service:account');

export class AccountService {
  public readonly account: Account;
  public readonly socket: AccountSocket;
  public readonly client: KyInstance;
  public readonly app: AppService;
  public readonly server: ServerService;

  private readonly accountSyncJobScheduleId: string;
  private readonly eventSubscriptionId: string;

  constructor(account: Account, server: ServerService, app: AppService) {
    debug(`Initializing account service for account ${account.id}`);

    this.account = account;
    this.server = server;
    this.app = app;

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
        event.isAvailable &&
        event.domain === this.server.domain
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
  }

  public updateAccount(account: Account): void {
    this.account.email = account.email;
    this.account.token = account.token;
    this.account.deviceId = account.deviceId;
  }

  public async logout(): Promise<void> {
    try {
      const workspaces = this.app
        .getWorkspaces()
        .filter((w) => w.account.id === this.account.id);

      for (const workspace of workspaces) {
        await workspace.delete();
      }

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

      this.socket.close();
      eventBus.unsubscribe(this.eventSubscriptionId);

      eventBus.publish({
        type: 'account.deleted',
        account: this.account,
      });
    } catch (error) {
      debug(`Error logging out of account ${this.account.id}: ${error}`);
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

      // Execute all database operations in a single transaction
      const result = await this.app.database
        .transaction()
        .execute(async (trx) => {
          // Update account
          const updatedAccount = await trx
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
            throw new Error(
              `Failed to update account ${this.account.email} after sync`
            );
          }

          const createdWorkspaces: SelectWorkspace[] = [];
          const updatedWorkspaces: SelectWorkspace[] = [];
          const deletedWorkspaces: SelectWorkspace[] = [];

          const currentWorkspaces = await trx
            .selectFrom('workspaces')
            .select('workspace_id')
            .where('account_id', '=', this.account.id)
            .execute();

          const currentWorkspaceIds = new Set(
            currentWorkspaces.map((w) => w.workspace_id)
          );

          for (const workspace of response.workspaces) {
            if (currentWorkspaceIds.has(workspace.id)) {
              // Update existing workspace
              const updatedWorkspace = await trx
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
                .where('workspace_id', '=', workspace.id)
                .executeTakeFirst();

              if (updatedWorkspace) {
                updatedWorkspaces.push(updatedWorkspace);
              }
            } else {
              // Create new workspace
              const createdWorkspace = await trx
                .insertInto('workspaces')
                .returningAll()
                .values({
                  workspace_id: workspace.id,
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

              if (createdWorkspace) {
                createdWorkspaces.push(createdWorkspace);
              }
            }
          }

          const serverWorkspaceIds = new Set(
            response.workspaces.map((w) => w.id)
          );

          const workspacesToDelete = [];
          for (const workspaceId of currentWorkspaceIds) {
            if (!serverWorkspaceIds.has(workspaceId)) {
              workspacesToDelete.push(workspaceId);
            }
          }

          if (workspacesToDelete.length > 0) {
            const deleted = await trx
              .deleteFrom('workspaces')
              .returningAll()
              .where('workspace_id', 'in', workspacesToDelete)
              .where('account_id', '=', this.account.id)
              .execute();

            for (const deletedWorkspace of deleted) {
              deletedWorkspaces.push(deletedWorkspace);
            }
          }

          return {
            updatedAccount,
            createdWorkspaces,
            updatedWorkspaces,
            deletedWorkspaces,
          };
        });

      debug(`Updated account ${this.account.email} after sync`);
      const account = mapAccount(result.updatedAccount);
      this.updateAccount(account);
      this.socket.checkConnection();

      eventBus.publish({
        type: 'account.updated',
        account,
      });

      for (const createdWorkspace of result.createdWorkspaces) {
        eventBus.publish({
          type: 'workspace.created',
          workspace: mapWorkspace(createdWorkspace),
        });
      }

      for (const updatedWorkspace of result.updatedWorkspaces) {
        eventBus.publish({
          type: 'workspace.updated',
          workspace: mapWorkspace(updatedWorkspace),
        });
      }

      for (const deletedWorkspace of result.deletedWorkspaces) {
        eventBus.publish({
          type: 'workspace.deleted',
          workspace: mapWorkspace(deletedWorkspace),
        });
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
