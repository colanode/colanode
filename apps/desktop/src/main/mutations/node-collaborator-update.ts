import { nodeService } from '@/main/services/node-service';
import { MutationHandler } from '@/main/types';
import {
  NodeCollaboratorUpdateMutationInput,
  NodeCollaboratorUpdateMutationOutput,
} from '@/shared/mutations/node-collaborator-update';
import { set } from 'lodash-es';

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