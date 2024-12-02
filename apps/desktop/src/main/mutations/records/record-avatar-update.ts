import { nodeService } from '@/main/services/node-service';
import { MutationHandler } from '@/main/types';
import {
  RecordAvatarUpdateMutationInput,
  RecordAvatarUpdateMutationOutput,
} from '@/shared/mutations/records/record-avatar-update';

export class RecordAvatarUpdateMutationHandler
  implements MutationHandler<RecordAvatarUpdateMutationInput>
{
  async handleMutation(
    input: RecordAvatarUpdateMutationInput
  ): Promise<RecordAvatarUpdateMutationOutput> {
    await nodeService.updateNode(input.recordId, input.userId, (attributes) => {
      if (attributes.type !== 'record') {
        throw new Error('Invalid node type');
      }

      attributes.avatar = input.avatar;
      return attributes;
    });

    return {
      success: true,
    };
  }
}
