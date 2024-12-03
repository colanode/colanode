import { AccountSyncOutput } from '@colanode/core';

import fs from 'fs';

import { createDebugger } from '@/main/debugger';
import { SelectAccount } from '@/main/data/app/schema';
import { databaseService } from '@/main/data/database-service';
import { serverService } from '@/main/services/server-service';
import {
  getAccountAvatarsDirectoryPath,
  getWorkspaceDirectoryPath,
  mapAccount,
  mapWorkspace,
} from '@/main/utils';
import { eventBus } from '@/shared/lib/event-bus';
import { httpClient } from '@/shared/lib/http-client';

class AccountService {
  private readonly debug = createDebugger('service:account');

  async syncAccounts() {
    this.debug('Syncing all accounts');

    const accounts = await databaseService.appDatabase
      .selectFrom('accounts')
      .selectAll()
      .execute();

    for (const account of accounts) {
      await this.syncAccount(account);
    }

    await this.syncDeletedTokens();
  }

  private async syncAccount(account: SelectAccount) {
    this.debug(`Syncing account ${account.email}`);

    const server = await databaseService.appDatabase
      .selectFrom('servers')
      .selectAll()
      .where('domain', '=', account.server)
      .executeTakeFirst();

    if (!server) {
      this.debug(
        `Server ${account.server} not found for syncing account ${account.email}`
      );
      return;
    }

    if (!serverService.isAvailable(server.domain)) {
      this.debug(
        `Server ${server.domain} is not available for syncing account ${account.email}`
      );
      return;
    }

    const { data, status } = await httpClient.get<AccountSyncOutput>(
      '/v1/accounts/sync',
      {
        domain: server.domain,
        token: account.token,
      }
    );

    this.debug(`Account sync response status code: ${status}`);

    if (status >= 400 && status < 500) {
      this.debug(`Account ${account.email} is not valid, logging out...`);
      await this.logoutAccount(account);
      return;
    }

    if (status !== 200) {
      return;
    }

    const currentWorkspaces = await databaseService.appDatabase
      .selectFrom('workspaces')
      .selectAll()
      .where('account_id', '=', account.id)
      .execute();

    const updatedAccount = await databaseService.appDatabase
      .updateTable('accounts')
      .returningAll()
      .set({
        name: data.account.name,
        avatar: data.account.avatar,
      })
      .where('id', '=', account.id)
      .executeTakeFirst();

    if (!updatedAccount) {
      this.debug(`Failed to update account ${account.email} after sync`);
      return;
    } else {
      this.debug(`Updated account ${account.email} after sync`);
    }

    eventBus.publish({
      type: 'account_updated',
      account: mapAccount(updatedAccount),
    });

    for (const workspace of data.workspaces) {
      const currentWorkspace = currentWorkspaces.find(
        (w) => w.workspace_id === workspace.id
      );

      if (!currentWorkspace) {
        // create workspace here
        const createdWorkspace = await databaseService.appDatabase
          .insertInto('workspaces')
          .values({
            workspace_id: workspace.id,
            user_id: workspace.user.id,
            account_id: account.id,
            name: workspace.name,
            avatar: workspace.avatar,
            description: workspace.description,
            role: workspace.user.role,
            version_id: workspace.versionId,
          })
          .returningAll()
          .executeTakeFirst();

        if (!createdWorkspace) {
          this.debug(
            `Failed to create workspace ${workspace.id} for account ${account.email}`
          );
          return;
        } else {
          this.debug(
            `Created workspace ${workspace.id} for account ${account.email} after sync`
          );
        }

        eventBus.publish({
          type: 'workspace_created',
          workspace: mapWorkspace(createdWorkspace),
        });
      } else {
        // update workspace here
        const updatedWorkspace = await databaseService.appDatabase
          .updateTable('workspaces')
          .returningAll()
          .set({
            name: workspace.name,
            avatar: workspace.avatar,
            description: workspace.description,
            role: workspace.user.role,
            version_id: workspace.versionId,
          })
          .where('user_id', '=', currentWorkspace.user_id)
          .executeTakeFirst();

        if (!updatedWorkspace) {
          this.debug(
            `Failed to update workspace ${currentWorkspace.user_id} for account ${account.email}`
          );
          return;
        } else {
          this.debug(
            `Updated workspace ${currentWorkspace.user_id} for account ${account.email} after sync`
          );
        }

        eventBus.publish({
          type: 'workspace_updated',
          workspace: mapWorkspace(updatedWorkspace),
        });
      }
    }

    for (const workspace of currentWorkspaces) {
      const updatedWorkspace = data.workspaces.find(
        (w) => w.id === workspace.workspace_id
      );

      if (!updatedWorkspace) {
        await this.deleteWorkspace(workspace.user_id);
      }
    }
  }

  public async logoutAccount(account: SelectAccount): Promise<boolean> {
    this.debug(`Logging out account ${account.email}`);

    const workspaces = await databaseService.appDatabase
      .selectFrom('workspaces')
      .select(['user_id'])
      .where('account_id', '=', account.id)
      .execute();

    for (const workspace of workspaces) {
      await this.deleteWorkspace(workspace.user_id);
    }

    const avatarsDir = getAccountAvatarsDirectoryPath(account.id);
    if (fs.existsSync(avatarsDir)) {
      fs.rmSync(avatarsDir, { recursive: true });
    }

    const deletedAccount = await databaseService.appDatabase
      .deleteFrom('accounts')
      .returningAll()
      .where('id', '=', account.id)
      .executeTakeFirst();

    if (!deletedAccount) {
      this.debug(`Failed to delete account ${account.email}`);
      return false;
    } else {
      this.debug(`Deleted account ${account.email}`);
    }

    eventBus.publish({
      type: 'account_deleted',
      account: mapAccount(deletedAccount),
    });

    await databaseService.appDatabase
      .insertInto('deleted_tokens')
      .values({
        token: account.token,
        account_id: account.id,
        server: account.server,
        created_at: new Date().toISOString(),
      })
      .execute();

    return true;
  }

  public async syncDeletedTokens() {
    this.debug('Syncing deleted tokens');

    const deletedTokens = await databaseService.appDatabase
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
      this.debug('No deleted tokens found');
      return;
    }

    for (const deletedToken of deletedTokens) {
      if (!serverService.isAvailable(deletedToken.domain)) {
        this.debug(
          `Server ${deletedToken.domain} is not available for logging out account ${deletedToken.account_id}`
        );
        continue;
      }

      try {
        const { status } = await httpClient.delete(`/v1/accounts/logout`, {
          domain: deletedToken.domain,
          token: deletedToken.token,
        });

        this.debug(`Deleted token logout response status code: ${status}`);

        if (status !== 200) {
          return;
        }

        await databaseService.appDatabase
          .deleteFrom('deleted_tokens')
          .where('token', '=', deletedToken.token)
          .where('account_id', '=', deletedToken.account_id)
          .execute();

        this.debug(
          `Logged out account ${deletedToken.account_id} from server ${deletedToken.domain}`
        );
      } catch {
        this.debug(
          `Failed to logout account ${deletedToken.account_id} from server ${deletedToken.domain}`
        );
      }
    }
  }

  private async deleteWorkspace(userId: string): Promise<boolean> {
    this.debug(`Deleting workspace ${userId}`);

    const deletedWorkspace = await databaseService.appDatabase
      .deleteFrom('workspaces')
      .returningAll()
      .where('user_id', '=', userId)
      .executeTakeFirst();

    if (!deletedWorkspace) {
      this.debug(`Failed to delete workspace ${userId}`);
      return false;
    } else {
      this.debug(`Deleted workspace ${userId}`);
    }

    await databaseService.deleteWorkspaceDatabase(userId);
    const workspaceDir = getWorkspaceDirectoryPath(userId);
    if (fs.existsSync(workspaceDir)) {
      fs.rmSync(workspaceDir, { recursive: true });
    }
    this.debug(`Deleted workspace directory ${workspaceDir}`);

    eventBus.publish({
      type: 'workspace_deleted',
      workspace: mapWorkspace(deletedWorkspace),
    });

    return true;
  }
}

export const accountService = new AccountService();
