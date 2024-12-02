import { nodeService } from '@/main/services/node-service';
import { MutationHandler } from '@/main/types';
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
    await nodeService.updateNode(input.recordId, input.userId, (attributes) => {
      if (attributes.type !== 'record') {
        throw new Error('Invalid node type');
      }

      attributes.fields[input.fieldId] = input.value;
      return attributes;
    });

    return {
      success: true,
    };
  }
}
