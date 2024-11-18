import { AccountListQueryInput } from '@/shared/queries/account-list';
import { databaseService } from '@/main/data/database-service';
import { Account } from '@/shared/types/accounts';
import { SelectAccount } from '@/main/data/app/schema';
import { ChangeCheckResult, QueryHandler } from '@/main/types';
import { Event } from '@/shared/types/events';
import { mapAccount } from '@/main/utils';

export class AccountListQueryHandler
  implements QueryHandler<AccountListQueryInput>
{
  public async handleQuery(_: AccountListQueryInput): Promise<Account[]> {
    const rows = await this.fetchAccounts();
    return rows.map(mapAccount);
  }

  public async checkForChanges(
    event: Event,
    _: AccountListQueryInput,
    output: Account[]
  ): Promise<ChangeCheckResult<AccountListQueryInput>> {
    if (event.type === 'account_created') {
      const newAccounts = [...output, event.account];
      return {
        hasChanges: true,
        result: newAccounts,
      };
    }

    if (event.type === 'account_updated') {
      const updatedAccounts = [...output].map((account) => {
        if (account.id === event.account.id) {
          return event.account;
        }
        return account;
      });

      return {
        hasChanges: true,
        result: updatedAccounts,
      };
    }

    if (event.type === 'account_deleted') {
      const activeAccounts = [...output].filter(
        (account) => account.id !== event.account.id
      );

      return {
        hasChanges: true,
        result: activeAccounts,
      };
    }

    return {
      hasChanges: false,
    };
  }

  private fetchAccounts(): Promise<SelectAccount[]> {
    return databaseService.appDatabase
      .selectFrom('accounts')
      .selectAll()
      .where('status', '=', 'active')
      .execute();
  }
}
