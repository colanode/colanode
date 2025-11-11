import { createRoute } from '@tanstack/react-router';

import { WorkspaceCreate } from '@colanode/ui/components/workspaces/workspace-create';
import { WorkspaceCreateTab } from '@colanode/ui/components/workspaces/workspace-create-tab';
import { rootRoute } from '@colanode/ui/routes/root';

export const workspaceCreateRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/create',
  component: WorkspaceCreate,
  context: () => {
    return {
      tab: <WorkspaceCreateTab />,
    };
  },
});
