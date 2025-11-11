import { createRoute, redirect } from '@tanstack/react-router';

import { WorkspaceUploadsContainer } from '@colanode/ui/components/workspaces/uploads/workspace-uploads-container';
import { WorkspaceUploadsHeader } from '@colanode/ui/components/workspaces/uploads/workspace-uploads-header';
import { WorkspaceUploadsTab } from '@colanode/ui/components/workspaces/uploads/workspace-uploads-tab';
import { getWorkspaceUserId } from '@colanode/ui/routes/utils';
import {
  workspaceRoute,
  workspaceMaskRoute,
} from '@colanode/ui/routes/workspace';

export const workspaceUploadsRoute = createRoute({
  getParentRoute: () => workspaceRoute,
  path: '/uploads',
  component: WorkspaceUploadsContainer,
  context: () => {
    return {
      tab: <WorkspaceUploadsTab />,
      header: <WorkspaceUploadsHeader />,
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
