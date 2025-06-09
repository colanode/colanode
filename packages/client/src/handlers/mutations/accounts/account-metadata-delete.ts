import { eventBus } from '@colanode/client/lib/event-bus';
import { mapAccountMetadata } from '@colanode/client/lib/mappers';
import { MutationHandler } from '@colanode/client/lib/types';
import {
  AccountMetadataDeleteMutationInput,
  AccountMetadataDeleteMutationOutput,
} from '@colanode/client/mutations/accounts/account-metadata-delete';
import { AppService } from '@colanode/client/services/app-service';

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
      type: 'account.metadata.deleted',
      accountId: input.accountId,
      metadata: mapAccountMetadata(deletedMetadata),
    });

    return {
      success: true,
    };
  }
}
