import { nodeService } from '@/main/services/node-service';
import { MutationHandler } from '@/main/types';
import { MutationError } from '@/shared/mutations';
import {
  FieldNameUpdateMutationInput,
  FieldNameUpdateMutationOutput,
} from '@/shared/mutations/databases/field-name-update';

export class FieldNameUpdateMutationHandler
  implements MutationHandler<FieldNameUpdateMutationInput>
{
  async handleMutation(
    input: FieldNameUpdateMutationInput
  ): Promise<FieldNameUpdateMutationOutput> {
    const result = await nodeService.updateNode(
      input.databaseId,
      input.userId,
      (attributes) => {
        if (attributes.type !== 'database') {
          throw new MutationError('invalid_attributes', 'Invalid node type');
        }

        const field = attributes.fields[input.fieldId];
        if (!field) {
          throw new MutationError(
            'field_not_found',
            'The field you are trying to update does not exist.'
          );
        }

        field.name = input.name;
        return attributes;
      }
    );

    if (result === 'unauthorized') {
      throw new MutationError(
        'unauthorized',
        "You don't have permission to update this field."
      );
    }

    if (result !== 'success') {
      throw new MutationError(
        'unknown',
        'Something went wrong while updating the field.'
      );
    }

    return {
      id: input.fieldId,
    };
  }
}
