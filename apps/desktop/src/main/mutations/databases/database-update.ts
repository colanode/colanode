import { nodeService } from '@/main/services/node-service';
import { MutationHandler } from '@/main/types';
import {
  DatabaseUpdateMutationInput,
  DatabaseUpdateMutationOutput,
} from '@/shared/mutations/databases/database-update';

export class DatabaseUpdateMutationHandler
  implements MutationHandler<DatabaseUpdateMutationInput>
{
  async handleMutation(
    input: DatabaseUpdateMutationInput
  ): Promise<DatabaseUpdateMutationOutput> {
    await nodeService.updateNode(
      input.databaseId,
      input.userId,
      (attributes) => {
        if (attributes.type !== 'database') {
          throw new Error('Node is not a database');
        }

        attributes.name = input.name;
        attributes.avatar = input.avatar;

        return attributes;
      }
    );

    return {
      success: true,
    };
  }
}
