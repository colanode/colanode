import { set } from 'lodash-es';

import { nodeService } from '@/main/services/node-service';
import { MutationHandler } from '@/main/types';
import {
  NodeCollaboratorUpdateMutationInput,
  NodeCollaboratorUpdateMutationOutput,
} from '@/shared/mutations/collaborators/node-collaborator-update';

export class NodeCollaboratorUpdateMutationHandler
  implements MutationHandler<NodeCollaboratorUpdateMutationInput>
{
  async handleMutation(
    input: NodeCollaboratorUpdateMutationInput
  ): Promise<NodeCollaboratorUpdateMutationOutput> {
    await nodeService.updateNode(input.nodeId, input.userId, (attributes) => {
      set(attributes, `collaborators.${input.collaboratorId}`, input.role);
      return attributes;
    });

    return {
      success: true,
    };
  }
}
