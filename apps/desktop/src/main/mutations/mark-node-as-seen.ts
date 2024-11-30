import { MutationHandler } from '@/main/types';
import {
  MarkNodeAsSeenMutationInput,
  MarkNodeAsSeenMutationOutput,
} from '@/shared/mutations/mark-node-as-seen';
import { interactionService } from '@/main/services/interaction-service';

export class MarkNodeAsSeenMutationHandler
  implements MutationHandler<MarkNodeAsSeenMutationInput>
{
  async handleMutation(
    input: MarkNodeAsSeenMutationInput
  ): Promise<MarkNodeAsSeenMutationOutput> {
    await interactionService.setInteraction(
      input.userId,
      input.nodeId,
      'message',
      'lastSeenAt',
      new Date().toISOString()
    );

    return {
      success: true,
    };
  }
}
