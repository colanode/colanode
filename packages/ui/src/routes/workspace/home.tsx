import { createRoute, notFound, redirect } from '@tanstack/react-router';

import { WorkspaceHomeScreen } from '@colanode/ui/components/workspaces/workspace-home-screen';
import { getWorkspaceUserId } from '@colanode/ui/routes/utils';
import {
  workspaceMaskRoute,
  workspaceRoute,
} from '@colanode/ui/routes/workspace';

export const workspaceHomeRoute = createRoute({
  getParentRoute: () => workspaceRoute,
  path: '/home',
  component: WorkspaceHomeScreen,
});

export const workspaceHomeMaskRoute = createRoute({
  getParentRoute: () => workspaceMaskRoute,
  path: '/home',
  component: () => null,
  beforeLoad: (ctx) => {
    const userId = getWorkspaceUserId(ctx.params.workspaceId);
    if (userId) {
      throw redirect({
        to: '/workspace/$userId/home',
        params: { userId },
        replace: true,
      });
    }

    throw notFound();
  },
});
