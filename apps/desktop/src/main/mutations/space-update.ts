import { nodeService } from '@/main/services/node-service';
import { MutationHandler } from '@/main/types';
import {
  SpaceUpdateMutationInput,
  SpaceUpdateMutationOutput,
} from '@/shared/mutations/space-update';

export class SpaceUpdateMutationHandler
  implements MutationHandler<SpaceUpdateMutationInput>
{
  async handleMutation(
    input: SpaceUpdateMutationInput
  ): Promise<SpaceUpdateMutationOutput> {
    await nodeService.updateNode(input.id, input.userId, (attributes) => {
      if (attributes.type !== 'space') {
        throw new Error('Node is not a space');
      }

      attributes.name = input.name;
      attributes.description = input.description;
      attributes.avatar = input.avatar;

      return attributes;
    });

    return {
      success: true,
    };
  }
}
