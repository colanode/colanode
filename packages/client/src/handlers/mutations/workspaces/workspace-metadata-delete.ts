import { WorkspaceMutationHandlerBase } from '@colanode/client/handlers/mutations/workspace-mutation-handler-base';
import { eventBus } from '@colanode/client/lib/event-bus';
import { mapWorkspaceMetadata } from '@colanode/client/lib/mappers';
import { MutationHandler } from '@colanode/client/lib/types';
import {
  WorkspaceMetadataDeleteMutationInput,
  WorkspaceMetadataDeleteMutationOutput,
} from '@colanode/client/mutations/workspaces/workspace-metadata-delete';

export class WorkspaceMetadataDeleteMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<WorkspaceMetadataDeleteMutationInput>
{
  async handleMutation(
    input: WorkspaceMetadataDeleteMutationInput
  ): Promise<WorkspaceMetadataDeleteMutationOutput> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);
    const deletedMetadata = await workspace.database
      .deleteFrom('metadata')
      .where('key', '=', input.key)
      .returningAll()
      .executeTakeFirst();

    if (!deletedMetadata) {
      return {
        success: true,
      };
    }

    eventBus.publish({
      type: 'workspace.metadata.deleted',
      accountId: input.accountId,
      workspaceId: input.workspaceId,
      metadata: mapWorkspaceMetadata(deletedMetadata),
    });

    return {
      success: true,
    };
  }
}
