import { MutationError, MutationErrorCode } from '@colanode/client/mutations';
import { AppService } from '@colanode/client/services/app-service';
import { WorkspaceService } from '@colanode/client/services/workspaces/workspace-service';
import { WorkspaceStatus } from '@colanode/core';

export abstract class WorkspaceMutationHandlerBase {
  protected readonly app: AppService;

  constructor(app: AppService) {
    this.app = app;
  }

  protected getWorkspace(userId: string): WorkspaceService {
    const workspace = this.app.getWorkspace(userId);
    if (!workspace) {
      throw new MutationError(
        MutationErrorCode.WorkspaceNotFound,
        'Workspace not found or has been deleted.'
      );
    }

    if (workspace.status === WorkspaceStatus.Readonly) {
      throw new MutationError(
        MutationErrorCode.WorkspaceReadonly,
        'Workspace is in readonly mode and you cannot make any changes.'
      );
    }

    return workspace;
  }
}
