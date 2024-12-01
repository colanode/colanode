import { AccountUpdateOutput } from '@colanode/core';

import { databaseService } from '@/main/data/database-service';
import { MutationHandler } from '@/main/types';
import { eventBus } from '@/shared/lib/event-bus';
import { httpClient } from '@/shared/lib/http-client';
import {
  AccountUpdateMutationInput,
  AccountUpdateMutationOutput,
} from '@/shared/mutations/account-update';

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
      throw new Error('Account not found!');
    }

    const server = await databaseService.appDatabase
      .selectFrom('servers')
      .selectAll()
      .where('domain', '=', account.server)
      .executeTakeFirst();

    if (!server) {
      throw new Error('Account not found');
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
      throw new Error('Account not found');
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
