import { eventBus } from '@colanode/client/lib/event-bus';
import { mapWorkspace } from '@colanode/client/lib/mappers';
import { MutationHandler } from '@colanode/client/lib/types';
import {
  MutationError,
  MutationErrorCode,
} from '@colanode/client/mutations';
import {
  WorkspaceTagsUpdateMutationInput,
  WorkspaceTagsUpdateMutationOutput,
} from '@colanode/client/mutations/workspaces/workspace-tags-update';
import { AppService } from '@colanode/client/services/app-service';

export class WorkspaceTagsUpdateMutationHandler
  implements MutationHandler<WorkspaceTagsUpdateMutationInput>
{
  private readonly app: AppService;

  constructor(app: AppService) {
    this.app = app;
  }

  async handleMutation(
    input: WorkspaceTagsUpdateMutationInput
  ): Promise<WorkspaceTagsUpdateMutationOutput> {
    const workspaceService = this.app.getWorkspace(input.userId);
    if (!workspaceService) {
      throw new MutationError(
        MutationErrorCode.WorkspaceNotFound,
        'Workspace not found.'
      );
    }

    const updatedWorkspace = await this.app.database
      .updateTable('workspaces')
      .returningAll()
      .set({
        tags: JSON.stringify(input.tags),
        updated_at: new Date().toISOString(),
      })
      .where('user_id', '=', input.userId)
      .executeTakeFirst();

    if (!updatedWorkspace) {
      throw new MutationError(
        MutationErrorCode.WorkspaceNotUpdated,
        'Something went wrong updating workspace tags. Please try again later.'
      );
    }

    const workspace = mapWorkspace(updatedWorkspace);
    workspaceService.updateWorkspace(workspace);

    eventBus.publish({
      type: 'workspace.updated',
      workspace,
    });

    return {
      success: true,
    };
  }
}
