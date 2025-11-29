import { createRoute, redirect } from '@tanstack/react-router';

import { AppAppearanceContainer } from '@colanode/ui/components/app/app-appearance-container';
import { AppAppearanceTab } from '@colanode/ui/components/app/app-appearance-tab';
import { getWorkspaceUserId } from '@colanode/ui/routes/utils';
import {
  workspaceRoute,
  workspaceMaskRoute,
} from '@colanode/ui/routes/workspace';

export const appAppearanceRoute = createRoute({
  getParentRoute: () => workspaceRoute,
  path: '/appearance',
  component: AppAppearanceContainer,
  context: () => {
    return {
      tab: <AppAppearanceTab />,
    };
  },
});

export const appAppearanceMaskRoute = createRoute({
  getParentRoute: () => workspaceMaskRoute,
  path: '/appearance',
  component: () => null,
  beforeLoad: (ctx) => {
    const userId = getWorkspaceUserId(ctx.params.workspaceId);
    if (userId) {
      throw redirect({
        to: '/workspace/$userId/appearance',
        params: { userId },
        replace: true,
      });
    }
  },
});
