import { createRoute, redirect } from '@tanstack/react-router';

import { WorkspaceTagsContainer } from '@colanode/ui/components/workspaces/workspace-tags-container';
import { WorkspaceTagsTab } from '@colanode/ui/components/workspaces/workspace-tags-tab';
import { getWorkspaceUserId } from '@colanode/ui/routes/utils';
import {
  workspaceRoute,
  workspaceMaskRoute,
} from '@colanode/ui/routes/workspace';

export const workspaceTagsRoute = createRoute({
  getParentRoute: () => workspaceRoute,
  path: '/settings/tags',
  component: WorkspaceTagsContainer,
  context: () => {
    return {
      tab: <WorkspaceTagsTab />,
    };
  },
});

export const workspaceTagsMaskRoute = createRoute({
  getParentRoute: () => workspaceMaskRoute,
  path: '/settings/tags',
  component: () => null,
  beforeLoad: (ctx) => {
    const userId = getWorkspaceUserId(ctx.params.workspaceId);
    if (userId) {
      throw redirect({
        to: '/workspace/$userId/settings/tags',
        params: { userId },
        replace: true,
      });
    }
  },
});
