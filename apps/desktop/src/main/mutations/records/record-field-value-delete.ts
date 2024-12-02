import { nodeService } from '@/main/services/node-service';
import { MutationHandler } from '@/main/types';
import { MutationError } from '@/shared/mutations';
import {
  RecordFieldValueDeleteMutationInput,
  RecordFieldValueDeleteMutationOutput,
} from '@/shared/mutations/records/record-field-value-delete';

export class RecordFieldValueDeleteMutationHandler
  implements MutationHandler<RecordFieldValueDeleteMutationInput>
{
  async handleMutation(
    input: RecordFieldValueDeleteMutationInput
  ): Promise<RecordFieldValueDeleteMutationOutput> {
    const result = await nodeService.updateNode(
      input.recordId,
      input.userId,
      (attributes) => {
        if (attributes.type !== 'record') {
          throw new MutationError('invalid_attributes', 'Invalid node type');
        }

        delete attributes.fields[input.fieldId];
        return attributes;
      }
    );

    if (result === 'unauthorized') {
      throw new MutationError(
        'unauthorized',
        "You don't have permission to delete this field value."
      );
    }

    if (result !== 'success') {
      throw new MutationError(
        'unknown',
        'Something went wrong while deleting the field value.'
      );
    }

    return {
      success: true,
    };
  }
}
