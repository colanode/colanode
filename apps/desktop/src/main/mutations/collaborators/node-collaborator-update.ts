import { set } from 'lodash-es';

import { nodeService } from '@/main/services/node-service';
import { MutationHandler } from '@/main/types';
import {
  NodeCollaboratorUpdateMutationInput,
  NodeCollaboratorUpdateMutationOutput,
} from '@/shared/mutations/collaborators/node-collaborator-update';
import { MutationError } from '@/shared/mutations';

export class NodeCollaboratorUpdateMutationHandler
  implements MutationHandler<NodeCollaboratorUpdateMutationInput>
{
  async handleMutation(
    input: NodeCollaboratorUpdateMutationInput
  ): Promise<NodeCollaboratorUpdateMutationOutput> {
    const result = await nodeService.updateNode(
      input.nodeId,
      input.userId,
      (attributes) => {
        set(attributes, `collaborators.${input.collaboratorId}`, input.role);
        return attributes;
      }
    );

    if (result === 'unauthorized') {
      throw new MutationError(
        'unauthorized',
        "You don't have permission to update collaborators for this node."
      );
    }

    if (result !== 'success') {
      throw new MutationError(
        'unknown',
        'Something went wrong while updating collaborators for the node.'
      );
    }

    return {
      success: true,
    };
  }
}
