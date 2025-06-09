import { SelectAccountMetadata } from '@colanode/client/databases/account/schema';
import { mapAccountMetadata } from '@colanode/client/lib/mappers';
import { ChangeCheckResult, QueryHandler } from '@colanode/client/lib/types';
import { AccountMetadataListQueryInput } from '@colanode/client/queries/accounts/account-metadata-list';
import { AppService } from '@colanode/client/services/app-service';
import { AccountMetadata } from '@colanode/client/types/accounts';
import { Event } from '@colanode/client/types/events';

export class AccountMetadataListQueryHandler
  implements QueryHandler<AccountMetadataListQueryInput>
{
  private readonly app: AppService;

  constructor(app: AppService) {
    this.app = app;
  }

  public async handleQuery(
    input: AccountMetadataListQueryInput
  ): Promise<AccountMetadata[]> {
    const rows = await this.getAccountMetadata(input.accountId);
    if (!rows) {
      return [];
    }

    return rows.map(mapAccountMetadata);
  }

  public async checkForChanges(
    event: Event,
    input: AccountMetadataListQueryInput,
    output: AccountMetadata[]
  ): Promise<ChangeCheckResult<AccountMetadataListQueryInput>> {
    if (
      event.type === 'account.created' &&
      event.account.id === input.accountId
    ) {
      const result = await this.handleQuery(input);
      return {
        hasChanges: true,
        result,
      };
    }

    if (
      event.type === 'account.deleted' &&
      event.account.id === input.accountId
    ) {
      return {
        hasChanges: true,
        result: [],
      };
    }

    if (
      event.type === 'account.metadata.updated' &&
      event.accountId === input.accountId
    ) {
      const newOutput = [
        ...output.filter((metadata) => metadata.key !== event.metadata.key),
        event.metadata,
      ];

      return {
        hasChanges: true,
        result: newOutput,
      };
    }

    if (
      event.type === 'account.metadata.deleted' &&
      event.accountId === input.accountId
    ) {
      const newOutput = output.filter(
        (metadata) => metadata.key !== event.metadata.key
      );

      return {
        hasChanges: true,
        result: newOutput,
      };
    }

    return {
      hasChanges: false,
    };
  }

  private async getAccountMetadata(
    accountId: string
  ): Promise<SelectAccountMetadata[] | undefined> {
    const account = this.app.getAccount(accountId);

    if (!account) {
      return undefined;
    }

    const rows = await account.database
      .selectFrom('metadata')
      .selectAll()
      .execute();

    return rows;
  }
}
