import { MutationHandler } from '../../../lib/types';
import { eventBus } from '../../../lib/event-bus';
import { mapAccountMetadata } from '../../../lib/mappers';
import { AppService } from '../../../services/app-service';
import {
  AccountMetadataSaveMutationInput,
  AccountMetadataSaveMutationOutput,
} from '../../../mutations/accounts/account-metadata-save';

export class AccountMetadataSaveMutationHandler
  implements MutationHandler<AccountMetadataSaveMutationInput>
{
  private readonly app: AppService;

  constructor(appService: AppService) {
    this.app = appService;
  }

  async handleMutation(
    input: AccountMetadataSaveMutationInput
  ): Promise<AccountMetadataSaveMutationOutput> {
    const account = this.app.getAccount(input.accountId);

    if (!account) {
      return {
        success: false,
      };
    }

    const createdMetadata = await account.database
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

    if (!createdMetadata) {
      return {
        success: false,
      };
    }

    eventBus.publish({
      type: 'account_metadata_saved',
      accountId: input.accountId,
      metadata: mapAccountMetadata(createdMetadata),
    });

    return {
      success: true,
    };
  }
}
