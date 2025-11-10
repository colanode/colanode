import { MutationHandler } from '@colanode/client/lib/types';
import { MutationError, MutationErrorCode } from '@colanode/client/mutations';
import {
  AccountLogoutMutationInput,
  AccountLogoutMutationOutput,
} from '@colanode/client/mutations/accounts/account-logout';
import { AppService } from '@colanode/client/services/app-service';

export class AccountLogoutMutationHandler
  implements MutationHandler<AccountLogoutMutationInput>
{
  private readonly app: AppService;

  constructor(appService: AppService) {
    this.app = appService;
  }

  async handleMutation(
    input: AccountLogoutMutationInput
  ): Promise<AccountLogoutMutationOutput> {
    const account = this.app.getAccount(input.accountId);

    if (!account) {
      throw new MutationError(
        MutationErrorCode.AccountNotFound,
        'Account was not found or has been logged out already. Try closing the app and opening it again.'
      );
    }

    await account.logout();
    return {
      success: true,
    };
  }
}
