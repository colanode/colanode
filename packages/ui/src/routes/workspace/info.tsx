import { createRoute, redirect } from '@tanstack/react-router';

import { InfoContainer } from '@colanode/ui/components/app/info-container';
import { InfoTab } from '@colanode/ui/components/app/info-tab';
import { getWorkspaceUserId } from '@colanode/ui/routes/utils';
import {
  workspaceMaskRoute,
  workspaceRoute,
} from '@colanode/ui/routes/workspace';

export const infoRoute = createRoute({
  getParentRoute: () => workspaceRoute,
  path: '/info',
  component: InfoContainer,
  context: () => {
    return {
      tab: <InfoTab />,
    };
  },
});

export const infoMaskRoute = createRoute({
  getParentRoute: () => workspaceMaskRoute,
  path: '/info',
  component: () => null,
  beforeLoad: (ctx) => {
    const userId = getWorkspaceUserId(ctx.params.workspaceId);
    if (userId) {
      throw redirect({
        to: '/workspace/$userId/info',
        params: { userId },
        replace: true,
      });
    }
  },
});
