import { KyInstance } from 'ky';
import { Kysely, Migration, Migrator } from 'kysely';
import ms from 'ms';

import {
  AccountDatabaseSchema,
  accountDatabaseMigrations,
} from '@colanode/client/databases/account';
import { eventBus } from '@colanode/client/lib/event-bus';
import { EventLoop } from '@colanode/client/lib/event-loop';
import { parseApiError } from '@colanode/client/lib/ky';
import { mapAccount, mapWorkspace } from '@colanode/client/lib/mappers';
import { AccountSocket } from '@colanode/client/services/accounts/account-socket';
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
  getIdType,
  IdType,
  Message,
} from '@colanode/core';

const debug = createDebugger('desktop:service:account');

export class AccountService {
  private readonly workspaces: Map<string, WorkspaceService> = new Map();
  private readonly eventLoop: EventLoop;
  private readonly account: Account;

  public readonly app: AppService;
  public readonly server: ServerService;
  public readonly database: Kysely<AccountDatabaseSchema>;

  public readonly socket: AccountSocket;
  public readonly client: KyInstance;
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

    this.socket = new AccountSocket(this);
    this.client = this.app.client.extend({
      prefixUrl: this.server.httpBaseUrl,
      headers: {
        Authorization: `Bearer ${this.account.token}`,
      },
    });

    this.eventLoop = new EventLoop(
      ms('1 minute'),
      ms('1 second'),
      this.sync.bind(this)
    );

    this.eventSubscriptionId = eventBus.subscribe((event) => {
      if (
        event.type === 'server.availability.changed' &&
        event.server.domain === this.server.domain &&
        event.isAvailable
      ) {
        this.eventLoop.trigger();
      } else if (
        event.type === 'account.connection.message.received' &&
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
    await this.app.fs.makeDirectory(this.app.path.account(this.account.id));
    await this.app.fs.makeDirectory(
      this.app.path.accountAvatars(this.account.id)
    );

    if (this.account.avatar) {
      await this.downloadAvatar(this.account.avatar);
    }

    this.socket.init();
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
      this.socket.close();
      this.eventLoop.stop();
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

  public async downloadAvatar(avatar: string): Promise<boolean> {
    const type = getIdType(avatar);
    if (type !== IdType.Avatar) {
      return false;
    }

    try {
      const avatarPath = this.app.path.accountAvatar(this.account.id, avatar);

      const exists = await this.app.fs.exists(avatarPath);
      if (exists) {
        return true;
      }

      const response = await this.client.get<ArrayBuffer>(
        `v1/avatars/${avatar}`
      );

      const avatarBytes = new Uint8Array(await response.arrayBuffer());
      await this.app.fs.writeFile(avatarPath, avatarBytes);

      eventBus.publish({
        type: 'avatar.downloaded',
        accountId: this.account.id,
        avatarId: avatar,
      });

      return true;
    } catch (err) {
      console.error(err);
      debug(`Error downloading avatar for account ${this.account.id}: ${err}`);
    }

    return false;
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

      if (updatedAccount.avatar) {
        await this.downloadAvatar(updatedAccount.avatar);
      }

      debug(`Updated account ${this.account.email} after sync`);
      const account = mapAccount(updatedAccount);
      this.updateAccount(account);

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

          if (createdWorkspace.avatar) {
            await this.downloadAvatar(createdWorkspace.avatar);
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

            if (updatedWorkspace.avatar) {
              await this.downloadAvatar(updatedWorkspace.avatar);
            }

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
