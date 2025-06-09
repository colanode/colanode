import { eventBus } from '@colanode/client/lib/event-bus';
import { mapAccount, mapWorkspace } from '@colanode/client/lib/mappers';
import { MutationError, MutationErrorCode } from '@colanode/client/mutations';
import { AppService } from '@colanode/client/services/app-service';
import { ServerService } from '@colanode/client/services/server-service';
import { LoginSuccessOutput } from '@colanode/core';

export abstract class AccountMutationHandlerBase {
  protected readonly app: AppService;

  constructor(app: AppService) {
    this.app = app;
  }

  protected async handleLoginSuccess(
    login: LoginSuccessOutput,
    server: ServerService
  ): Promise<void> {
    const createdAccount = await this.app.database
      .insertInto('accounts')
      .returningAll()
      .values({
        id: login.account.id,
        email: login.account.email,
        name: login.account.name,
        server: server.domain,
        token: login.token,
        device_id: login.deviceId,
        avatar: login.account.avatar,
        created_at: new Date().toISOString(),
      })
      .executeTakeFirst();

    if (!createdAccount) {
      throw new MutationError(
        MutationErrorCode.AccountLoginFailed,
        'Account login failed, please try again.'
      );
    }

    const account = mapAccount(createdAccount);
    const accountService = await this.app.initAccount(account);

    eventBus.publish({
      type: 'account.created',
      account: account,
    });

    if (login.workspaces.length === 0) {
      return;
    }

    for (const workspace of login.workspaces) {
      const createdWorkspace = await accountService.database
        .insertInto('workspaces')
        .returningAll()
        .values({
          id: workspace.id,
          name: workspace.name,
          user_id: workspace.user.id,
          account_id: account.id,
          role: workspace.user.role,
          storage_limit: workspace.user.storageLimit,
          max_file_size: workspace.user.maxFileSize,
          avatar: workspace.avatar,
          description: workspace.description,
          created_at: new Date().toISOString(),
        })
        .executeTakeFirst();

      if (!createdWorkspace) {
        continue;
      }

      await accountService.initWorkspace(mapWorkspace(createdWorkspace));
      eventBus.publish({
        type: 'workspace.created',
        workspace: mapWorkspace(createdWorkspace),
      });
    }
  }
}
