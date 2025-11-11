import { createRoute, redirect } from '@tanstack/react-router';

import { WorkspaceHomeBreadcrumb } from '@colanode/ui/components/workspaces/workspace-home-breadcrumb';
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
  context: () => {
    return {
      breadcrumb: <WorkspaceHomeBreadcrumb />,
    };
  },
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
