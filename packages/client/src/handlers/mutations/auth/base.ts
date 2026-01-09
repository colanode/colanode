import { eventBus } from '@colanode/client/lib/event-bus';
import { mapAccount, mapWorkspace } from '@colanode/client/lib/mappers';
import { MutationError, MutationErrorCode } from '@colanode/client/mutations';
import { AppService } from '@colanode/client/services/app-service';
import { ServerService } from '@colanode/client/services/server-service';
import { LoginSuccessOutput } from '@colanode/core';

export abstract class AuthMutationHandlerBase {
  protected readonly app: AppService;

  constructor(app: AppService) {
    this.app = app;
  }

  protected async handleLoginSuccess(
    login: LoginSuccessOutput,
    server: ServerService
  ): Promise<void> {
    const { createdAccount, createdWorkspaces } = await this.app.database
      .transaction()
      .execute(async (trx) => {
        const createdAccount = await trx
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

        const createdWorkspaces = [];
        if (login.workspaces.length > 0) {
          for (const workspace of login.workspaces) {
            const createdWorkspace = await trx
              .insertInto('workspaces')
              .returningAll()
              .values({
                workspace_id: workspace.id,
                name: workspace.name,
                user_id: workspace.user.id,
                account_id: createdAccount.id,
                role: workspace.user.role,
                max_file_size: workspace.maxFileSize ?? undefined,
                avatar: workspace.avatar,
                description: workspace.description,
                created_at: new Date().toISOString(),
                status: workspace.status,
              })
              .executeTakeFirst();

            if (createdWorkspace) {
              createdWorkspaces.push(createdWorkspace);
            }
          }
        }

        return { createdAccount, createdWorkspaces };
      });

    const account = mapAccount(createdAccount);
    await this.app.initAccount(account);

    eventBus.publish({
      type: 'account.created',
      account: account,
    });

    for (const createdWorkspace of createdWorkspaces) {
      await this.app.initWorkspace(createdWorkspace);
      eventBus.publish({
        type: 'workspace.created',
        workspace: mapWorkspace(createdWorkspace),
      });
    }
  }
}
