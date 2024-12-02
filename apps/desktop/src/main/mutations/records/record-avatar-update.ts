import { nodeService } from '@/main/services/node-service';
import { MutationHandler } from '@/main/types';
import { MutationError } from '@/shared/mutations';
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
    const result = await nodeService.updateNode(
      input.recordId,
      input.userId,
      (attributes) => {
        if (attributes.type !== 'record') {
          throw new MutationError('invalid_attributes', 'Invalid node type');
        }

        attributes.avatar = input.avatar;
        return attributes;
      }
    );

    if (result === 'unauthorized') {
      throw new MutationError(
        'unauthorized',
        "You don't have permission to update this record."
      );
    }

    return {
      success: true,
    };
  }
}
