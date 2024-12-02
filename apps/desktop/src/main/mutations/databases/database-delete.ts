import { nodeService } from '@/main/services/node-service';
import { MutationHandler } from '@/main/types';
import {
  DatabaseDeleteMutationInput,
  DatabaseDeleteMutationOutput,
} from '@/shared/mutations/databases/database-delete';

export class DatabaseDeleteMutationHandler
  implements MutationHandler<DatabaseDeleteMutationInput>
{
  async handleMutation(
    input: DatabaseDeleteMutationInput
  ): Promise<DatabaseDeleteMutationOutput> {
    await nodeService.deleteNode(input.databaseId, input.userId);

    return {
      success: true,
    };
  }
}
