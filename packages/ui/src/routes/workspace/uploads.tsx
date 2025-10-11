import { createRoute, notFound, redirect } from '@tanstack/react-router';

import { WorkspaceUploadsScreen } from '@colanode/ui/components/workspaces/uploads/workspace-uploads-screen';
import { getWorkspaceUserId } from '@colanode/ui/routes/utils';
import {
  workspaceRoute,
  workspaceMaskRoute,
} from '@colanode/ui/routes/workspace';

export const workspaceUploadsRoute = createRoute({
  getParentRoute: () => workspaceRoute,
  path: '/uploads',
  component: WorkspaceUploadsScreen,
});

export const workspaceUploadsMaskRoute = createRoute({
  getParentRoute: () => workspaceMaskRoute,
  path: '/uploads',
  component: () => null,
  beforeLoad: (ctx) => {
    const userId = getWorkspaceUserId(ctx.params.workspaceId);
    if (userId) {
      throw redirect({
        to: '/workspace/$userId/uploads',
        params: { userId },
        replace: true,
      });
    }

    throw notFound();
  },
});
