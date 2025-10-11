import { createRoute } from '@tanstack/react-router';

import { WorkspaceScreen } from '@colanode/ui/components/workspaces/workspace-screen';
import { WorkspaceTab } from '@colanode/ui/components/workspaces/workspace-tab';
import { rootRoute } from '@colanode/ui/routes/root';

export const workspaceRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/workspace/$userId',
  component: WorkspaceScreen,
  context: (ctx) => {
    return {
      tab: <WorkspaceTab userId={ctx.params.userId} />,
    };
  },
});

export const workspaceMaskRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/$workspaceId',
  component: () => null,
});
