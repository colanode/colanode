import { AccountUpdateInput, AccountUpdateOutput } from '@colanode/core';

import { MutationHandler } from '@/main/lib/types';
import { eventBus } from '@/shared/lib/event-bus';
import {
  AccountUpdateMutationInput,
  AccountUpdateMutationOutput,
} from '@/shared/mutations/accounts/account-update';
import { MutationError, MutationErrorCode } from '@/shared/mutations';
import { parseApiError } from '@/shared/lib/axios';
import { appService } from '@/main/services/app-service';
import { mapAccount } from '@/main/lib/mappers';

export class AccountUpdateMutationHandler
  implements MutationHandler<AccountUpdateMutationInput>
{
  async handleMutation(
    input: AccountUpdateMutationInput
  ): Promise<AccountUpdateMutationOutput> {
    const accountService = appService.getAccount(input.id);

    if (!accountService) {
      throw new MutationError(
        MutationErrorCode.AccountNotFound,
        'Account not found or has been logged out already. Try closing the app and opening it again.'
      );
    }

    try {
      const body: AccountUpdateInput = {
        name: input.name,
        avatar: input.avatar,
      };

      const { data } = await accountService.client.put<AccountUpdateOutput>(
        `/v1/accounts/${input.id}`,
        body
      );

      const updatedAccount = await appService.database
        .updateTable('accounts')
        .set({
          name: data.name,
          avatar: data.avatar,
          updated_at: new Date().toISOString(),
        })
        .where('id', '=', input.id)
        .returningAll()
        .executeTakeFirst();

      if (!updatedAccount) {
        throw new MutationError(
          MutationErrorCode.AccountNotFound,
          'Account not found or has been logged out already. Try closing the app and opening it again.'
        );
      }

      const account = mapAccount(updatedAccount);
      accountService.updateAccount(account);

      eventBus.publish({
        type: 'account_updated',
        account,
      });

      return {
        success: true,
      };
    } catch (error) {
      const apiError = parseApiError(error);
      throw new MutationError(MutationErrorCode.ApiError, apiError.message);
    }
  }
}
