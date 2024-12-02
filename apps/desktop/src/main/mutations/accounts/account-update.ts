import { AccountUpdateOutput } from '@colanode/core';

import { databaseService } from '@/main/data/database-service';
import { MutationHandler } from '@/main/types';
import { eventBus } from '@/shared/lib/event-bus';
import { httpClient } from '@/shared/lib/http-client';
import {
  AccountUpdateMutationInput,
  AccountUpdateMutationOutput,
} from '@/shared/mutations/accounts/account-update';
import { MutationError } from '@/shared/mutations';

export class AccountUpdateMutationHandler
  implements MutationHandler<AccountUpdateMutationInput>
{
  async handleMutation(
    input: AccountUpdateMutationInput
  ): Promise<AccountUpdateMutationOutput> {
    const account = await databaseService.appDatabase
      .selectFrom('accounts')
      .selectAll()
      .where('id', '=', input.id)
      .executeTakeFirst();

    if (!account) {
      throw new MutationError(
        'account_not_found',
        'Account not found or has been logged out already. Try closing the app and opening it again.'
      );
    }

    const server = await databaseService.appDatabase
      .selectFrom('servers')
      .selectAll()
      .where('domain', '=', account.server)
      .executeTakeFirst();

    if (!server) {
      throw new MutationError(
        'server_not_found',
        `The server ${account.server} associated with this account was not found. Try closing the app and opening it again.`
      );
    }

    const { data } = await httpClient.put<AccountUpdateOutput>(
      `/v1/accounts/${input.id}`,
      {
        name: input.name,
        avatar: input.avatar,
      },
      {
        domain: server.domain,
        token: account.token,
      }
    );

    const updatedAccount = await databaseService.appDatabase
      .updateTable('accounts')
      .set({
        name: data.name,
        avatar: data.avatar,
      })
      .where('id', '=', input.id)
      .returningAll()
      .executeTakeFirst();

    if (!updatedAccount) {
      throw new MutationError(
        'account_not_found',
        'Account not found or has been logged out already. Try closing the app and opening it again.'
      );
    }

    eventBus.publish({
      type: 'account_updated',
      account: {
        id: updatedAccount.id,
        name: updatedAccount.name,
        email: updatedAccount.email,
        token: updatedAccount.token,
        avatar: updatedAccount.avatar,
        deviceId: updatedAccount.device_id,
        server: updatedAccount.server,
        status: updatedAccount.status,
      },
    });

    return {
      success: true,
    };
  }
}
