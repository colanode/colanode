import { QueryError, QueryErrorCode } from '@colanode/client/queries';
import { AppService } from '@colanode/client/services/app-service';
import { WorkspaceService } from '@colanode/client/services/workspaces/workspace-service';

export abstract class WorkspaceQueryHandlerBase {
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
      throw new QueryError(
        QueryErrorCode.AccountNotFound,
        'Account not found or has been logged out already. Try closing the app and opening it again.'
      );
    }

    const workspace = account.getWorkspace(workspaceId);
    if (!workspace) {
      throw new QueryError(
        QueryErrorCode.WorkspaceNotFound,
        'Workspace not found or has been deleted.'
      );
    }

    return workspace;
  }
}
