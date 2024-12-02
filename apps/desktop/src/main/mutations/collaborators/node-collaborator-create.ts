import { set } from 'lodash-es';

import { nodeService } from '@/main/services/node-service';
import { MutationHandler } from '@/main/types';
import {
  NodeCollaboratorCreateMutationInput,
  NodeCollaboratorCreateMutationOutput,
} from '@/shared/mutations/collaborators/node-collaborator-create';
import { MutationError } from '@/shared/mutations';

export class NodeCollaboratorCreateMutationHandler
  implements MutationHandler<NodeCollaboratorCreateMutationInput>
{
  async handleMutation(
    input: NodeCollaboratorCreateMutationInput
  ): Promise<NodeCollaboratorCreateMutationOutput> {
    const result = await nodeService.updateNode(
      input.nodeId,
      input.userId,
      (attributes) => {
        for (const collaboratorId of input.collaboratorIds) {
          set(attributes, `collaborators.${collaboratorId}`, input.role);
        }
        return attributes;
      }
    );

    if (result === 'unauthorized') {
      throw new MutationError(
        'unauthorized',
        "You don't have permission to add collaborators to this node."
      );
    }

    if (result !== 'success') {
      throw new MutationError(
        'unknown',
        'Something went wrong while adding collaborators to the node.'
      );
    }

    return {
      success: true,
    };
  }
}
