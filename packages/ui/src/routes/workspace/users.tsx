import { createRoute, notFound, redirect } from '@tanstack/react-router';

import { WorkspaceUsersScreen } from '@colanode/ui/components/workspaces/workspace-users-screen';
import { getWorkspaceUserId } from '@colanode/ui/routes/utils';
import {
  workspaceRoute,
  workspaceMaskRoute,
} from '@colanode/ui/routes/workspace';

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
    const userId = getWorkspaceUserId(ctx.params.workspaceId);
    if (userId) {
      throw redirect({
        to: '/workspace/$userId/users',
        params: { userId },
        replace: true,
      });
    }

    throw notFound();
  },
});
