import { createRoute, notFound, redirect } from '@tanstack/react-router';

import { WorkspaceSettingsScreen } from '@colanode/ui/components/workspaces/workspace-settings-screen';
import { getWorkspaceUserId } from '@colanode/ui/routes/utils';
import {
  workspaceRoute,
  workspaceMaskRoute,
} from '@colanode/ui/routes/workspace';

export const workspaceSettingsRoute = createRoute({
  getParentRoute: () => workspaceRoute,
  path: '/settings',
  component: WorkspaceSettingsScreen,
});

export const workspaceSettingsMaskRoute = createRoute({
  getParentRoute: () => workspaceMaskRoute,
  path: '/settings',
  component: () => null,
  beforeLoad: (ctx) => {
    const userId = getWorkspaceUserId(ctx.params.workspaceId);
    if (userId) {
      throw redirect({
        to: '/workspace/$userId/settings',
        params: { userId },
        replace: true,
      });
    }

    throw notFound();
  },
});
