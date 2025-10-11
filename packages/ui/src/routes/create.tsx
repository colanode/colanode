import { createRoute } from '@tanstack/react-router';

import { WorkspaceCreateScreen } from '@colanode/ui/components/workspaces/workspace-create-screen';
import { rootRoute } from '@colanode/ui/routes/root';

export const workspaceCreateRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/create',
  component: WorkspaceCreateScreen,
});
