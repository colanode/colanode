import { createRoute, notFound, redirect } from '@tanstack/react-router';

import { WorkspaceUsersScreen } from '@colanode/ui/components/workspaces/workspace-users-screen';
import {
  workspaceRoute,
  workspaceMaskRoute,
} from '@colanode/ui/routes/account/workspace';
import { getAccountForWorkspace } from '@colanode/ui/routes/utils';

export const workspaceUsersRoute = createRoute({
  getParentRoute: () => workspaceRoute,
  path: '/users',
  component: WorkspaceUsersScreen,
});

export const workspaceUsersMaskRoute = createRoute({
  getParentRoute: () => workspaceMaskRoute,
  path: '/users',
  component: () => null,
  beforeLoad: (ctx) => {
    const account = getAccountForWorkspace(ctx.params.workspaceId);
    if (account) {
      throw redirect({
        to: '/acc/$accountId/$workspaceId/users',
        params: { accountId: account, workspaceId: ctx.params.workspaceId },
        replace: true,
      });
    }

    throw notFound();
  },
});
