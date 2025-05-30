import { unset } from 'lodash-es';

import { WorkspaceMutationHandlerBase } from '@colanode/client/handlers/mutations/workspace-mutation-handler-base';
import { MutationHandler } from '@colanode/client/lib/types';
import {
  NodeCollaboratorDeleteMutationInput,
  NodeCollaboratorDeleteMutationOutput,
  MutationError,
  MutationErrorCode,
} from '@colanode/client/mutations';

export class NodeCollaboratorDeleteMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<NodeCollaboratorDeleteMutationInput>
{
  async handleMutation(
    input: NodeCollaboratorDeleteMutationInput
  ): Promise<NodeCollaboratorDeleteMutationOutput> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    const result = await workspace.nodes.updateNode(
      input.nodeId,
      (attributes) => {
        unset(attributes, `collaborators.${input.collaboratorId}`);
        return attributes;
      }
    );

    if (result === 'unauthorized') {
      throw new MutationError(
        MutationErrorCode.NodeCollaboratorDeleteForbidden,
        "You don't have permission to remove collaborators from this node."
      );
    }

    if (result !== 'success') {
      throw new MutationError(
        MutationErrorCode.NodeCollaboratorDeleteFailed,
        'Something went wrong while removing collaborators from the node.'
      );
    }

    return {
      success: true,
    };
  }
}
