import { nodeService } from '@/main/services/node-service';
import { MutationHandler } from '@/main/types';
import { MutationError } from '@/shared/mutations';
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
    const result = await nodeService.updateNode(
      input.databaseId,
      input.userId,
      (attributes) => {
        if (attributes.type !== 'database') {
          throw new MutationError(
            'invalid_attributes',
            'Node is not a database'
          );
        }

        attributes.name = input.name;
        attributes.avatar = input.avatar;

        return attributes;
      }
    );

    if (result === 'unauthorized') {
      throw new MutationError(
        'unauthorized',
        "You don't have permission to update this database."
      );
    }

    if (result !== 'success') {
      throw new MutationError(
        'unknown',
        'Something went wrong while updating the database.'
      );
    }

    return {
      success: true,
    };
  }
}
