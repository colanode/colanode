import { MutationHandler } from '../../../lib/types';
import { eventBus } from '../../../lib/event-bus';
import { mapAccountMetadata } from '../../../lib/mappers';
import { AppService } from '../../../services/app-service';
import {
  AccountMetadataDeleteMutationInput,
  AccountMetadataDeleteMutationOutput,
} from '../../../mutations/accounts/account-metadata-delete';

export class AccountMetadataDeleteMutationHandler
  implements MutationHandler<AccountMetadataDeleteMutationInput>
{
  private readonly app: AppService;

  constructor(appService: AppService) {
    this.app = appService;
  }

  async handleMutation(
    input: AccountMetadataDeleteMutationInput
  ): Promise<AccountMetadataDeleteMutationOutput> {
    const account = this.app.getAccount(input.accountId);

    if (!account) {
      return {
        success: false,
      };
    }

    const deletedMetadata = await account.database
      .deleteFrom('metadata')
      .where('key', '=', input.key)
      .returningAll()
      .executeTakeFirst();

    if (!deletedMetadata) {
      return {
        success: true,
      };
    }

    eventBus.publish({
      type: 'account_metadata_deleted',
      accountId: input.accountId,
      metadata: mapAccountMetadata(deletedMetadata),
    });

    return {
      success: true,
    };
  }
}
