import { nodeService } from '@/main/services/node-service';
import { MutationHandler } from '@/main/types';
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
    await nodeService.updateNode(input.recordId, input.userId, (attributes) => {
      if (attributes.type !== 'record') {
        throw new Error('Invalid node type');
      }

      delete attributes.fields[input.fieldId];
      return attributes;
    });

    return {
      success: true,
    };
  }
}
