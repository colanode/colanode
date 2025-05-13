import { SelectAccount } from '../../../databases/app';
import { AppService } from '../../../services/app-service';
import { ChangeCheckResult, QueryHandler } from '../../../lib/types';
import { mapAccount } from '../../../lib/mappers';
import { AccountGetQueryInput } from '../../../queries/accounts/account-get';
import { Account } from '../../../types/accounts';
import { Event } from '../../../types/events';

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
      event.type === 'account_created' &&
      event.account.id === input.accountId
    ) {
      return {
        hasChanges: true,
        result: event.account,
      };
    }

    if (
      event.type === 'account_updated' &&
      event.account.id === input.accountId
    ) {
      return {
        hasChanges: true,
        result: event.account,
      };
    }

    if (
      event.type === 'account_deleted' &&
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
