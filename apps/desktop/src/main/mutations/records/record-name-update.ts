import { nodeService } from '@/main/services/node-service';
import { MutationHandler } from '@/main/types';
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
    await nodeService.updateNode(input.recordId, input.userId, (attributes) => {
      if (attributes.type !== 'record') {
        throw new Error('Invalid node type');
      }

      attributes.name = input.name;
      return attributes;
    });

    return {
      success: true,
    };
  }
}
