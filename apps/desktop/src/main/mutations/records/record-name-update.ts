import { nodeService } from '@/main/services/node-service';
import { MutationHandler } from '@/main/types';
import { MutationError } from '@/shared/mutations';
import {
  RecordNameUpdateMutationInput,
  RecordNameUpdateMutationOutput,
} from '@/shared/mutations/records/record-name-update';

export class RecordNameUpdateMutationHandler
  implements MutationHandler<RecordNameUpdateMutationInput>
{
  async handleMutation(
    input: RecordNameUpdateMutationInput
  ): Promise<RecordNameUpdateMutationOutput> {
    const result = await nodeService.updateNode(
      input.recordId,
      input.userId,
      (attributes) => {
        if (attributes.type !== 'record') {
          throw new MutationError('invalid_attributes', 'Invalid node type');
        }

        attributes.name = input.name;
        return attributes;
      }
    );

    if (result === 'unauthorized') {
      throw new MutationError(
        'unauthorized',
        "You don't have permission to update this record."
      );
    }

    if (result !== 'success') {
      throw new MutationError(
        'unknown',
        'Something went wrong while updating the record name.'
      );
    }

    return {
      success: true,
    };
  }
}
