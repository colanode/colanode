import fs from 'fs';
import { databaseService } from '@/main/data/database-service';
import { SelectAccount } from '@/main/data/app/schema';
import { AccountSyncOutput } from '@colanode/core';
import { httpClient } from '@/shared/lib/http-client';
import {
  getWorkspaceDirectoryPath,
  mapAccount,
  mapWorkspace,
} from '@/main/utils';
import { getAccountAvatarsDirectoryPath } from '@/main/utils';
import { eventBus } from '@/shared/lib/event-bus';
import { serverService } from '@/main/services/server-service';

class AccountService {
  async syncAccounts() {
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
    const server = await databaseService.appDatabase
      .selectFrom('servers')
      .selectAll()
      .where('domain', '=', account.server)
      .executeTakeFirst();

    if (!server) {
      throw new Error('Server not found!');
    }

    if (!serverService.isAvailable(server.domain)) {
      return;
    }

    const { data, status } = await httpClient.get<AccountSyncOutput>(
      '/v1/accounts/sync',
      {
        domain: server.domain,
        token: account.token,
      }
    );

    if (status >= 400 && status < 500) {
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
      return;
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
          return;
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
          return;
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
      return false;
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
      return;
    }

    for (const deletedToken of deletedTokens) {
      if (!serverService.isAvailable(deletedToken.domain)) {
        continue;
      }

      try {
        const { status } = await httpClient.delete(`/v1/accounts/logout`, {
          domain: deletedToken.domain,
          token: deletedToken.token,
        });

        if (status !== 200) {
          return;
        }

        await databaseService.appDatabase
          .deleteFrom('deleted_tokens')
          .where('token', '=', deletedToken.token)
          .where('account_id', '=', deletedToken.account_id)
          .execute();
      } catch (error) {
        // console.log('error', error);
      }
    }
  }

  private async deleteWorkspace(userId: string): Promise<boolean> {
    const deletedWorkspace = await databaseService.appDatabase
      .deleteFrom('workspaces')
      .returningAll()
      .where('user_id', '=', userId)
      .executeTakeFirst();

    if (!deletedWorkspace) {
      return false;
    }

    await databaseService.deleteWorkspaceDatabase(userId);
    const workspaceDir = getWorkspaceDirectoryPath(userId);
    if (fs.existsSync(workspaceDir)) {
      fs.rmSync(workspaceDir, { recursive: true });
    }

    eventBus.publish({
      type: 'workspace_deleted',
      workspace: mapWorkspace(deletedWorkspace),
    });

    return true;
  }
}

export const accountService = new AccountService();
