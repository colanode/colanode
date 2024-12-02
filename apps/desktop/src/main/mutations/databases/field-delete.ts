import { nodeService } from '@/main/services/node-service';
import { MutationHandler } from '@/main/types';
import { MutationError } from '@/shared/mutations';
import {
  FieldDeleteMutationInput,
  FieldDeleteMutationOutput,
} from '@/shared/mutations/databases/field-delete';

export class FieldDeleteMutationHandler
  implements MutationHandler<FieldDeleteMutationInput>
{
  async handleMutation(
    input: FieldDeleteMutationInput
  ): Promise<FieldDeleteMutationOutput> {
    const result = await nodeService.updateNode(
      input.databaseId,
      input.userId,
      (attributes) => {
        if (attributes.type !== 'database') {
          throw new MutationError('invalid_attributes', 'Invalid node type');
        }

        if (!attributes.fields[input.fieldId]) {
          throw new MutationError(
            'field_not_found',
            'The field you are trying to delete does not exist.'
          );
        }

        delete attributes.fields[input.fieldId];

        return attributes;
      }
    );

    if (result === 'unauthorized') {
      throw new MutationError(
        'unauthorized',
        "You don't have permission to delete this field."
      );
    }

    if (result !== 'success') {
      throw new MutationError(
        'unknown',
        'Something went wrong while deleting the field.'
      );
    }

    return {
      id: input.fieldId,
    };
  }
}
