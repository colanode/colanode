import { eventBus } from '@colanode/client/lib/event-bus';
import { mapAccountMetadata } from '@colanode/client/lib/mappers';
import { MutationHandler } from '@colanode/client/lib/types';
import {
  AccountMetadataUpsertMutationInput,
  AccountMetadataUpsertMutationOutput,
} from '@colanode/client/mutations/accounts/account-metadata-upsert';
import { AppService } from '@colanode/client/services/app-service';

export class AccountMetadataUpsertMutationHandler
  implements MutationHandler<AccountMetadataUpsertMutationInput>
{
  private readonly app: AppService;

  constructor(appService: AppService) {
    this.app = appService;
  }

  async handleMutation(
    input: AccountMetadataUpsertMutationInput
  ): Promise<AccountMetadataUpsertMutationOutput> {
    const account = this.app.getAccount(input.accountId);

    if (!account) {
      return {
        success: false,
      };
    }

    const upsertedMetadata = await account.database
      .insertInto('metadata')
      .returningAll()
      .values({
        key: input.key,
        value: JSON.stringify(input.value),
        created_at: new Date().toISOString(),
      })
      .onConflict((cb) =>
        cb.columns(['key']).doUpdateSet({
          value: JSON.stringify(input.value),
          updated_at: new Date().toISOString(),
        })
      )
      .executeTakeFirst();

    if (!upsertedMetadata) {
      return {
        success: false,
      };
    }

    eventBus.publish({
      type: 'account_metadata_saved',
      accountId: input.accountId,
      metadata: mapAccountMetadata(upsertedMetadata),
    });

    return {
      success: true,
    };
  }
}
