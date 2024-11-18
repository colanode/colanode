import { AccountListQueryInput } from '@/shared/queries/account-list';
import { databaseService } from '@/main/data/database-service';
import { Account } from '@/shared/types/accounts';
import { SelectAccount } from '@/main/data/app/schema';
import { ChangeCheckResult, QueryHandler } from '@/main/types';
import { Event } from '@/shared/types/events';

export class AccountListQueryHandler
  implements QueryHandler<AccountListQueryInput>
{
  public async handleQuery(_: AccountListQueryInput): Promise<Account[]> {
    const rows = await this.fetchAccounts();
    return this.buildAccounts(rows);
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

  private buildAccounts(rows: SelectAccount[]): Account[] {
    return rows.map((row) => {
      return {
        id: row.id,
        name: row.name,
        avatar: row.avatar,
        token: row.token,
        email: row.email,
        deviceId: row.device_id,
        status: row.status,
        server: row.server,
      };
    });
  }
}
