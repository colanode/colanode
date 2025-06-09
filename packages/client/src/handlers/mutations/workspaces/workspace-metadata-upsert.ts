import { WorkspaceMutationHandlerBase } from '@colanode/client/handlers/mutations/workspace-mutation-handler-base';
import { eventBus } from '@colanode/client/lib/event-bus';
import { mapWorkspaceMetadata } from '@colanode/client/lib/mappers';
import { MutationHandler } from '@colanode/client/lib/types';
import {
  WorkspaceMetadataUpsertMutationInput,
  WorkspaceMetadataUpsertMutationOutput,
} from '@colanode/client/mutations/workspaces/workspace-metadata-upsert';

export class WorkspaceMetadataUpsertMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<WorkspaceMetadataUpsertMutationInput>
{
  async handleMutation(
    input: WorkspaceMetadataUpsertMutationInput
  ): Promise<WorkspaceMetadataUpsertMutationOutput> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    const upsertedMetadata = await workspace.database
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

    if (!upsertedMetadata) {
      return {
        success: false,
      };
    }

    eventBus.publish({
      type: 'workspace_metadata_saved',
      accountId: input.accountId,
      workspaceId: input.workspaceId,
      metadata: mapWorkspaceMetadata(upsertedMetadata),
    });

    return {
      success: true,
    };
  }
}
