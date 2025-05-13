import { MutationHandler } from '../../../lib/types';
import {
  WorkspaceMetadataSaveMutationInput,
  WorkspaceMetadataSaveMutationOutput,
} from '../../../mutations/workspaces/workspace-metadata-save';
import { WorkspaceMutationHandlerBase } from '../workspace-mutation-handler-base';
import { eventBus } from '../../../lib/event-bus';
import { mapWorkspaceMetadata } from '../../../lib/mappers';

export class WorkspaceMetadataSaveMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<WorkspaceMetadataSaveMutationInput>
{
  async handleMutation(
    input: WorkspaceMetadataSaveMutationInput
  ): Promise<WorkspaceMetadataSaveMutationOutput> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);
    const createdMetadata = await workspace.database
      .insertInto('metadata')
      .returningAll()
      .values({
        key: input.key,
        value: JSON.stringify(input.value),
        created_at: new Date().toISOString(),
      })
      .onConflict((cb) =>
        cb.columns(['key']).doUpdateSet({
          value: JSON.stringify(input.value),
          updated_at: new Date().toISOString(),
        })
      )
      .executeTakeFirst();

    if (!createdMetadata) {
      return {
        success: false,
      };
    }

    eventBus.publish({
      type: 'workspace_metadata_saved',
      accountId: input.accountId,
      workspaceId: input.workspaceId,
      metadata: mapWorkspaceMetadata(createdMetadata),
    });

    return {
      success: true,
    };
  }
}
