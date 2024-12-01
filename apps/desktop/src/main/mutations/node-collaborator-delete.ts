import { unset } from 'lodash-es';

import { nodeService } from '@/main/services/node-service';
import { MutationHandler } from '@/main/types';
import {
  NodeCollaboratorDeleteMutationInput,
  NodeCollaboratorDeleteMutationOutput,
} from '@/shared/mutations/node-collaborator-delete';

export class NodeCollaboratorDeleteMutationHandler
  implements MutationHandler<NodeCollaboratorDeleteMutationInput>
{
  async handleMutation(
    input: NodeCollaboratorDeleteMutationInput
  ): Promise<NodeCollaboratorDeleteMutationOutput> {
    await nodeService.updateNode(input.nodeId, input.userId, (attributes) => {
      unset(attributes, `collaborators.${input.collaboratorId}`);
      return attributes;
    });

    return {
      success: true,
    };
  }
}
