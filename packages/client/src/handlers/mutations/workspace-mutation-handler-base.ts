import { AppService } from '../../services/app-service';
import { MutationError, MutationErrorCode } from '../../mutations';
import { WorkspaceService } from '../../services/workspaces/workspace-service';

export abstract class WorkspaceMutationHandlerBase {
  protected readonly app: AppService;

  constructor(app: AppService) {
    this.app = app;
  }

  protected getWorkspace(
    accountId: string,
    workspaceId: string
  ): WorkspaceService {
    const account = this.app.getAccount(accountId);
    if (!account) {
      throw new MutationError(
        MutationErrorCode.AccountNotFound,
        'Account not found or has been logged out already. Try closing the app and opening it again.'
      );
    }

    const workspace = account.getWorkspace(workspaceId);
    if (!workspace) {
      throw new MutationError(
        MutationErrorCode.WorkspaceNotFound,
        'Workspace not found or has been deleted.'
      );
    }

    return workspace;
  }
}
