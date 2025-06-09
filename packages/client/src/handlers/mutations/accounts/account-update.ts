import { eventBus } from '@colanode/client/lib/event-bus';
import { parseApiError } from '@colanode/client/lib/ky';
import { mapAccount } from '@colanode/client/lib/mappers';
import { MutationHandler } from '@colanode/client/lib/types';
import { MutationError, MutationErrorCode } from '@colanode/client/mutations';
import {
  AccountUpdateMutationInput,
  AccountUpdateMutationOutput,
} from '@colanode/client/mutations/accounts/account-update';
import { AppService } from '@colanode/client/services/app-service';
import { AccountUpdateInput, AccountUpdateOutput } from '@colanode/core';

export class AccountUpdateMutationHandler
  implements MutationHandler<AccountUpdateMutationInput>
{
  private readonly app: AppService;

  constructor(appService: AppService) {
    this.app = appService;
  }

  async handleMutation(
    input: AccountUpdateMutationInput
  ): Promise<AccountUpdateMutationOutput> {
    const accountService = this.app.getAccount(input.id);

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

      const response = await accountService.client
        .patch(`v1/accounts`, {
          json: body,
        })
        .json<AccountUpdateOutput>();

      const updatedAccount = await this.app.database
        .updateTable('accounts')
        .set({
          name: response.name,
          avatar: response.avatar,
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
        type: 'account.updated',
        account,
      });

      return {
        success: true,
      };
    } catch (error) {
      const apiError = await parseApiError(error);
      throw new MutationError(MutationErrorCode.ApiError, apiError.message);
    }
  }
}
