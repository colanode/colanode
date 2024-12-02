import { nodeService } from '@/main/services/node-service';
import { MutationHandler } from '@/main/types';
import {
  RecordDeleteMutationInput,
  RecordDeleteMutationOutput,
} from '@/shared/mutations/records/record-delete';

export class RecordDeleteMutationHandler
  implements MutationHandler<RecordDeleteMutationInput>
{
  async handleMutation(
    input: RecordDeleteMutationInput
  ): Promise<RecordDeleteMutationOutput> {
    await nodeService.deleteNode(input.recordId, input.userId);

    return {
      success: true,
    };
  }
}
