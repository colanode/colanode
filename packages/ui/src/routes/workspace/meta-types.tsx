import { createRoute, redirect } from '@tanstack/react-router';

import { WorkspaceMetaTypesContainer } from '@colanode/ui/components/workspaces/workspace-meta-types-container';
import { WorkspaceMetaTypesTab } from '@colanode/ui/components/workspaces/workspace-meta-types-tab';
import { getWorkspaceUserId } from '@colanode/ui/routes/utils';
import {
  workspaceRoute,
  workspaceMaskRoute,
} from '@colanode/ui/routes/workspace';

export const workspaceMetaTypesRoute = createRoute({
  getParentRoute: () => workspaceRoute,
  path: '/settings/meta-types',
  component: WorkspaceMetaTypesContainer,
  context: () => ({
    tab: <WorkspaceMetaTypesTab />,
  }),
});

export const workspaceMetaTypesMaskRoute = createRoute({
  getParentRoute: () => workspaceMaskRoute,
  path: '/settings/meta-types',
  component: () => null,
  beforeLoad: (ctx) => {
    const userId = getWorkspaceUserId(ctx.params.workspaceId);
    if (userId) {
      throw redirect({
        to: '/workspace/$userId/settings/meta-types',
        params: { userId },
        replace: true,
      });
    }
  },
});
