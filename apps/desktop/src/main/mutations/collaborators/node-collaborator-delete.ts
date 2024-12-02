import { unset } from 'lodash-es';

import { nodeService } from '@/main/services/node-service';
import { MutationHandler } from '@/main/types';
import {
  NodeCollaboratorDeleteMutationInput,
  NodeCollaboratorDeleteMutationOutput,
} from '@/shared/mutations/collaborators/node-collaborator-delete';
import { MutationError } from '@/shared/mutations';

export class NodeCollaboratorDeleteMutationHandler
  implements MutationHandler<NodeCollaboratorDeleteMutationInput>
{
  async handleMutation(
    input: NodeCollaboratorDeleteMutationInput
  ): Promise<NodeCollaboratorDeleteMutationOutput> {
    const result = await nodeService.updateNode(
      input.nodeId,
      input.userId,
      (attributes) => {
        unset(attributes, `collaborators.${input.collaboratorId}`);
        return attributes;
      }
    );

    if (result === 'unauthorized') {
      throw new MutationError(
        'unauthorized',
        "You don't have permission to remove collaborators from this node."
      );
    }

    if (result !== 'success') {
      throw new MutationError(
        'unknown',
        'Something went wrong while removing collaborators from the node.'
      );
    }

    return {
      success: true,
    };
  }
}
