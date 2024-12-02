import { nodeService } from '@/main/services/node-service';
import { MutationHandler } from '@/main/types';
import {
  SpaceDeleteMutationInput,
  SpaceDeleteMutationOutput,
} from '@/shared/mutations/spaces/space-delete';

export class SpaceDeleteMutationHandler
  implements MutationHandler<SpaceDeleteMutationInput>
{
  async handleMutation(
    input: SpaceDeleteMutationInput
  ): Promise<SpaceDeleteMutationOutput> {
    await nodeService.deleteNode(input.spaceId, input.userId);

    return {
      success: true,
    };
  }
}
