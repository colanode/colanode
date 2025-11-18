import { createRoute, redirect } from '@tanstack/react-router';

import { WorkspaceHomeContainer } from '@colanode/ui/components/workspaces/workspace-home-container';
import { getWorkspaceUserId } from '@colanode/ui/routes/utils';
import {
  workspaceMaskRoute,
  workspaceRoute,
} from '@colanode/ui/routes/workspace';

export const workspaceHomeRoute = createRoute({
  getParentRoute: () => workspaceRoute,
  path: '/home',
  component: WorkspaceHomeContainer,
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
  },
});
