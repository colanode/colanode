import { createRoute, notFound } from '@tanstack/react-router';

import { collections } from '@colanode/ui/collections';
import { Workspace } from '@colanode/ui/components/workspaces/workspace';
import { WorkspaceNotFound } from '@colanode/ui/components/workspaces/workspace-not-found';
import { WorkspaceTab } from '@colanode/ui/components/workspaces/workspace-tab';
import { rootRoute } from '@colanode/ui/routes/root';
import { getWorkspaceUserId } from '@colanode/ui/routes/utils';

export const workspaceRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/workspace/$userId',
  component: () => {
    const { userId } = workspaceRoute.useParams();
    return <Workspace userId={userId} />;
  },
  notFoundComponent: WorkspaceNotFound,
  context: (ctx) => {
    return {
      tab: <WorkspaceTab userId={ctx.params.userId} />,
    };
  },
  loader: (ctx) => {
    const workspace = collections.workspaces.get(ctx.params.userId);
    if (!workspace) {
      throw notFound();
    }
  },
});

export const workspaceMaskRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/$workspaceId',
  notFoundComponent: WorkspaceNotFound,
  loader: (ctx) => {
    const userId = getWorkspaceUserId(ctx.params.workspaceId);
    if (!userId) {
      throw notFound();
    }
  },
});
