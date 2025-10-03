import { createRoute } from '@tanstack/react-router';

import { WorkspaceScreen } from '@colanode/ui/components/workspaces/workspace-screen';
import { WorkspaceTab } from '@colanode/ui/components/workspaces/workspace-tab';
import { accountRoute } from '@colanode/ui/routes/account';
import { rootRoute } from '@colanode/ui/routes/root';

export const workspaceRoute = createRoute({
  getParentRoute: () => accountRoute,
  path: '/$workspaceId',
  component: WorkspaceScreen,
  context: (ctx) => {
    return {
      tab: (
        <WorkspaceTab
          accountId={ctx.params.accountId}
          workspaceId={ctx.params.workspaceId}
        />
      ),
    };
  },
});

export const workspaceMaskRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/$workspaceId',
  component: () => null,
});
