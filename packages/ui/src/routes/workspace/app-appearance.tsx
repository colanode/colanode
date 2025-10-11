import { createRoute, notFound, redirect } from '@tanstack/react-router';

import { AppAppearanceSettingsScreen } from '@colanode/ui/components/app/app-appearance-settings-screen';
import { getWorkspaceUserId } from '@colanode/ui/routes/utils';
import {
  workspaceRoute,
  workspaceMaskRoute,
} from '@colanode/ui/routes/workspace';

export const appAppearanceRoute = createRoute({
  getParentRoute: () => workspaceRoute,
  path: '/app/appearance',
  component: AppAppearanceSettingsScreen,
});

export const appAppearanceMaskRoute = createRoute({
  getParentRoute: () => workspaceMaskRoute,
  path: '/app/appearance',
  component: () => null,
  beforeLoad: (ctx) => {
    const userId = getWorkspaceUserId(ctx.params.workspaceId);
    if (userId) {
      throw redirect({
        to: '/workspace/$userId/app/appearance',
        params: { userId },
        replace: true,
      });
    }

    throw notFound();
  },
});
