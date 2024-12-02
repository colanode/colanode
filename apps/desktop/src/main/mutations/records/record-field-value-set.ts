import { nodeService } from '@/main/services/node-service';
import { MutationHandler } from '@/main/types';
import { MutationError } from '@/shared/mutations';
import {
  RecordFieldValueSetMutationInput,
  RecordFieldValueSetMutationOutput,
} from '@/shared/mutations/records/record-field-value-set';

export class RecordFieldValueSetMutationHandler
  implements MutationHandler<RecordFieldValueSetMutationInput>
{
  async handleMutation(
    input: RecordFieldValueSetMutationInput
  ): Promise<RecordFieldValueSetMutationOutput> {
    const result = await nodeService.updateNode(
      input.recordId,
      input.userId,
      (attributes) => {
        if (attributes.type !== 'record') {
          throw new MutationError('invalid_attributes', 'Invalid node type');
        }

        attributes.fields[input.fieldId] = input.value;
        return attributes;
      }
    );

    if (result === 'unauthorized') {
      throw new MutationError(
        'unauthorized',
        "You don't have permission to set this field value."
      );
    }

    if (result !== 'success') {
      throw new MutationError(
        'unknown',
        'Something went wrong while setting the field value.'
      );
    }

    return {
      success: true,
    };
  }
}
