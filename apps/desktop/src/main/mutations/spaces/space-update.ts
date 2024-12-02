import { nodeService } from '@/main/services/node-service';
import { MutationHandler } from '@/main/types';
import { MutationError } from '@/shared/mutations';
import {
  SpaceUpdateMutationInput,
  SpaceUpdateMutationOutput,
} from '@/shared/mutations/spaces/space-update';

export class SpaceUpdateMutationHandler
  implements MutationHandler<SpaceUpdateMutationInput>
{
  async handleMutation(
    input: SpaceUpdateMutationInput
  ): Promise<SpaceUpdateMutationOutput> {
    const result = await nodeService.updateNode(
      input.id,
      input.userId,
      (attributes) => {
        if (attributes.type !== 'space') {
          throw new MutationError('invalid_attributes', 'Node is not a space');
        }

        attributes.name = input.name;
        attributes.description = input.description;
        attributes.avatar = input.avatar;

        return attributes;
      }
    );

    if (result === 'unauthorized') {
      throw new MutationError(
        'unauthorized',
        "You don't have permission to update this space."
      );
    }

    if (result !== 'success') {
      throw new MutationError(
        'unknown',
        'Something went wrong while updating the space.'
      );
    }

    return {
      success: true,
    };
  }
}
