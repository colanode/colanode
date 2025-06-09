import { SelectAccount } from '@colanode/client/databases/app';
import { mapAccount } from '@colanode/client/lib/mappers';
import { ChangeCheckResult, QueryHandler } from '@colanode/client/lib/types';
import { AccountGetQueryInput } from '@colanode/client/queries/accounts/account-get';
import { AppService } from '@colanode/client/services/app-service';
import { Account } from '@colanode/client/types/accounts';
import { Event } from '@colanode/client/types/events';

export class AccountGetQueryHandler
  implements QueryHandler<AccountGetQueryInput>
{
  private readonly app: AppService;

  constructor(app: AppService) {
    this.app = app;
  }

  public async handleQuery(
    input: AccountGetQueryInput
  ): Promise<Account | null> {
    const row = await this.fetchAccount(input.accountId);
    if (!row) {
      return null;
    }

    return mapAccount(row);
  }

  public async checkForChanges(
    event: Event,
    input: AccountGetQueryInput
  ): Promise<ChangeCheckResult<AccountGetQueryInput>> {
    if (
      event.type === 'account.created' &&
      event.account.id === input.accountId
    ) {
      return {
        hasChanges: true,
        result: event.account,
      };
    }

    if (
      event.type === 'account.updated' &&
      event.account.id === input.accountId
    ) {
      return {
        hasChanges: true,
        result: event.account,
      };
    }

    if (
      event.type === 'account.deleted' &&
      event.account.id === input.accountId
    ) {
      return {
        hasChanges: true,
        result: null,
      };
    }

    return {
      hasChanges: false,
    };
  }

  private fetchAccount(accountId: string): Promise<SelectAccount | undefined> {
    return this.app.database
      .selectFrom('accounts')
      .selectAll()
      .where('id', '=', accountId)
      .executeTakeFirst();
  }
}
