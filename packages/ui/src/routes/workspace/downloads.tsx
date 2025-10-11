import { createRoute, notFound, redirect } from '@tanstack/react-router';

import { WorkspaceDownloadsScreen } from '@colanode/ui/components/workspaces/downloads/workspace-downloads-screen';
import { getWorkspaceUserId } from '@colanode/ui/routes/utils';
import {
  workspaceRoute,
  workspaceMaskRoute,
} from '@colanode/ui/routes/workspace';

export const workspaceDownloadsRoute = createRoute({
  getParentRoute: () => workspaceRoute,
  path: '/downloads',
  component: WorkspaceDownloadsScreen,
});

export const workspaceDownloadsMaskRoute = createRoute({
  getParentRoute: () => workspaceMaskRoute,
  path: '/downloads',
  component: () => null,
  beforeLoad: (ctx) => {
    const userId = getWorkspaceUserId(ctx.params.workspaceId);
    if (userId) {
      throw redirect({
        to: '/workspace/$userId/downloads',
        params: { userId },
        replace: true,
      });
    }

    throw notFound();
  },
});
