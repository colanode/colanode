import { createRoute, redirect } from '@tanstack/react-router';

import { WorkspaceUploadsScreen } from '@colanode/ui/components/workspaces/uploads/workspace-uploads-screen';
import { WorkspaceUploadsTab } from '@colanode/ui/components/workspaces/uploads/workspace-uploads-tab';
import { getWorkspaceUserId } from '@colanode/ui/routes/utils';
import {
  workspaceRoute,
  workspaceMaskRoute,
} from '@colanode/ui/routes/workspace';

export const workspaceUploadsRoute = createRoute({
  getParentRoute: () => workspaceRoute,
  path: '/uploads',
  component: WorkspaceUploadsScreen,
  context: () => {
    return {
      tab: <WorkspaceUploadsTab />,
    };
  },
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
  },
});
